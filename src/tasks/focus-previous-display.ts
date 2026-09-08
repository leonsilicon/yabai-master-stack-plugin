import { defineTask } from "#utils/task.ts";
import { navigateDisplay } from "#utils/display-navigation.ts";
export const focusPreviousDisplay = defineTask(async () => {
  await navigateDisplay(-1, false);
});
