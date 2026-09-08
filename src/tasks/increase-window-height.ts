import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { resize } from "#utils/resize.ts";
export const increaseWindowHeight = defineTask(async (runtime: YMSPRuntime) => {
  await resize(runtime, "height", 1);
});
