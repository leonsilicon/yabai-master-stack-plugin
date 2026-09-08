import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { navigateWindow } from "#utils/navigation.ts";
export const moveWindowDown = defineTask(async (runtime: YMSPRuntime) => {
  await navigateWindow(runtime, 1, true);
});
