import type { YMSPRuntime } from "./runtime.ts";

export type TaskContext = {
  active: boolean;
  controller: AbortController;
  error?: Error;
};

export function assertTaskLock(runtime: YMSPRuntime): void {
  const context = runtime.taskContext.getStore();
  if (context?.error) throw context.error;
  if (!context?.active) {
    throw Object.assign(new Error("No active ymsp task lock; use withTaskLock or defineTask"), {
      code: "ELOCKED",
    });
  }
}

/** Queries outside a task remain usable; work from an expired task must stop. */
export function getTaskSignal(runtime: YMSPRuntime): AbortSignal | undefined {
  if (!runtime.taskContext.getStore()) return undefined;
  assertTaskLock(runtime);
  return runtime.taskContext.getStore()!.controller.signal;
}
