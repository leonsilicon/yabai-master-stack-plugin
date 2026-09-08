import { defineTask } from "#utils/task.ts";
import { resize } from "#utils/resize.ts";
export const decreaseMasterWidth = defineTask(async () => {
  await resize("width", -1);
});
