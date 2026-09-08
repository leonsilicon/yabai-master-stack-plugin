import fs from "node:fs";
import path from "node:path";
import lockfile from "proper-lockfile";
import { taskLockOptions } from "./lock.ts";
import { assertTaskLock, type TaskContext } from "./task-context.ts";

import type { YMSPRuntime } from "./runtime.ts";

/** Shared coordination for the CLI and embedded callers. Await nested operations sequentially. */
export function withTaskLock<T>(runtime: YMSPRuntime, cb: () => Promise<T>): Promise<T> {
  if (runtime.taskContext.getStore()) {
    return Promise.resolve().then(() => {
      assertTaskLock(runtime);
      return cb();
    });
  }
  const task = runtime.queue.then(async () => {
    const { lockfilePath } = runtime;
    if (lockfilePath) fs.mkdirSync(path.dirname(lockfilePath), { recursive: true });
    const context: TaskContext = { active: true, controller: new AbortController() };
    let release = async () => {};
    try {
      if (lockfilePath)
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
      return await runtime.taskContext.run(context, async () => {
        const result = await cb();
        assertTaskLock(runtime);
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
  runtime.queue = task.catch(() => {});
  return task;
}

/** Serialize complete tasks, including BSP rebuilds, across API calls and processes. */
export function defineTask<Args extends unknown[]>(
  cb: (runtime: YMSPRuntime, ...args: Args) => Promise<void>,
): (runtime: YMSPRuntime, ...args: Args) => Promise<void> {
  return (runtime, ...args) => withTaskLock(runtime, () => cb(runtime, ...args));
}
