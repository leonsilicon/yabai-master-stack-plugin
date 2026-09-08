import { defineTask } from "#utils/task.ts";
import { navigateWindow } from "#utils/navigation.ts";
export const moveWindowUp = defineTask(async () => {
  await navigateWindow(-1, true);
});
