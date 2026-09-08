import { defineTask } from "#utils/task.ts";
import { resize } from "#utils/resize.ts";
export const decreaseWindowHeight = defineTask(async () => {
  await resize("height", -1);
});
