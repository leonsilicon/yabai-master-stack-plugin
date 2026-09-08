import { AsyncLocalStorage } from "node:async_hooks";

export type TaskContext = {
  active: boolean;
  controller: AbortController;
  error?: Error;
};

export const taskContext = new AsyncLocalStorage<TaskContext>();

export function assertTaskLock(): void {
  const context = taskContext.getStore();
  if (context?.error) throw context.error;
  if (!context?.active) {
    throw Object.assign(new Error("No active ymsp task lock; use withTaskLock or defineTask"), {
      code: "ELOCKED",
    });
  }
}

/** Queries outside a task remain usable; work from an expired task must stop. */
export function getTaskSignal(): AbortSignal | undefined {
  if (!taskContext.getStore()) return undefined;
  assertTaskLock();
  return taskContext.getStore()!.controller.signal;
}
