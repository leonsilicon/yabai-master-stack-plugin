import fs from "node:fs";
import path from "node:path";
import lockfile from "proper-lockfile";
import { lockfilePath, taskLockOptions } from "./lock.ts";
import { assertTaskLock, taskContext, type TaskContext } from "./task-context.ts";

let queue: Promise<unknown> = Promise.resolve();

/** Shared coordination for the CLI and embedded callers. Await nested operations sequentially. */
export function withTaskLock<T>(cb: () => Promise<T>): Promise<T> {
  if (taskContext.getStore()) {
    return Promise.resolve().then(() => {
      assertTaskLock();
      return cb();
    });
  }
  const task = queue.then(async () => {
    fs.mkdirSync(path.dirname(lockfilePath), { recursive: true });
    const context: TaskContext = { active: true, controller: new AbortController() };
    let release: () => Promise<void>;
    try {
      release = await lockfile.lock(lockfilePath, {
        ...taskLockOptions,
        lockfilePath,
        onCompromised(error) {
          context.error = error;
          context.controller.abort(error);
        },
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ELOCKED") {
        throw Object.assign(
          new Error(`Timed out waiting for the ymsp task lock (${lockfilePath})`, { cause: error }),
          { code: "ELOCKED" },
        );
      }
      throw error;
    }
    try {
      return await taskContext.run(context, async () => {
        const result = await cb();
        assertTaskLock();
        return result;
      });
    } catch (error) {
      throw context.error ?? error;
    } finally {
      context.active = false;
      // proper-lockfile invalidates its release function when ownership is compromised.
      // Never remove another owner's lock or replace the original error with ERELEASED.
      if (!context.error) await release();
    }
  });
  queue = task.catch(() => {});
  return task;
}

/** Serialize complete tasks, including BSP rebuilds, across API calls and processes. */
export function defineTask<Args extends unknown[]>(
  cb: (...args: Args) => Promise<void>,
): (...args: Args) => Promise<void> {
  return (...args) => withTaskLock(() => cb(...args));
}
