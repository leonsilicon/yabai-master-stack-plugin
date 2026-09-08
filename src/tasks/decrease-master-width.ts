import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { resize } from "#utils/resize.ts";
export const decreaseMasterWidth = defineTask(async (runtime: YMSPRuntime) => {
  await resize(runtime, "width", -1);
});
