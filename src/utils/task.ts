import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { lockfilePath } from "./lock.ts";

let queue: Promise<unknown> = Promise.resolve();

async function acquireLock() {
  fs.mkdirSync(path.dirname(lockfilePath), { recursive: true });
  const deadline = Date.now() + 30000;
  while (true) {
    try {
      const fd = fs.openSync(lockfilePath, "wx");
      try {
        fs.writeFileSync(fd, process.pid.toString());
      } finally {
        fs.closeSync(fd);
      }
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    try {
      const owner = Number(fs.readFileSync(lockfilePath, "utf8"));
      if (Number.isInteger(owner) && owner > 0) {
        try {
          process.kill(owner, 0);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ESRCH") fs.unlinkSync(lockfilePath);
        }
      } else if (Date.now() - fs.statSync(lockfilePath).mtimeMs > 30000) {
        fs.unlinkSync(lockfilePath);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (Date.now() >= deadline) throw new Error("Timed out waiting for the ymsp task lock");
    await setTimeout(25);
  }
}

/** Serialize complete tasks, including BSP rebuilds, across API calls and processes. */
export function defineTask<Args extends unknown[]>(
  cb: (...args: Args) => Promise<void>,
): (...args: Args) => Promise<void> {
  return (...args) => {
    const task = queue.then(async () => {
      await acquireLock();
      try {
        await cb(...args);
      } finally {
        if (fs.readFileSync(lockfilePath, "utf8") === process.pid.toString())
          fs.unlinkSync(lockfilePath);
      }
    });
    queue = task.catch(() => {});
    return task;
  };
}
