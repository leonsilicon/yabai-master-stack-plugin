import { defineTask } from "#utils/task.ts";
import { resize } from "#utils/resize.ts";
export const increaseWindowHeight = defineTask(async () => {
  await resize("height", 1);
});
