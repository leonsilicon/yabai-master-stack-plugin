import { defineTask } from "#utils/task.ts";
import { navigateDisplay } from "#utils/display-navigation.ts";
export const focusNextDisplay = defineTask(async () => {
  await navigateDisplay(1, false);
});
