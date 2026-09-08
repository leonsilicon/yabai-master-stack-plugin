import { defineTask } from "#utils/task.ts";
import { resize } from "#utils/resize.ts";
export const increaseMasterWidth = defineTask(async () => {
  await resize("width", 1);
});
