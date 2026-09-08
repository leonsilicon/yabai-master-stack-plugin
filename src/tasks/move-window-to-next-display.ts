import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { navigateDisplay } from "#utils/display-navigation.ts";
export const moveWindowToNextDisplay = defineTask(async (runtime: YMSPRuntime) => {
  await navigateDisplay(runtime, 1, true);
});
