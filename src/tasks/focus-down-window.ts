import { defineTask } from "#utils/task.ts";
import { navigateWindow } from "#utils/navigation.ts";
export const focusDownWindow = defineTask(async () => {
  await navigateWindow(1, false);
});
