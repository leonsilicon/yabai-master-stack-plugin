import { getConfig } from "#utils/config.ts";
import { defineTask } from "#utils/task.ts";

export const focusMasterWindow = defineTask(async () => {
  const config = getConfig();
  switch (config.masterPosition) {
    case "right": {
      await Bun.spawn([config.yabaiPath, "-m", "window", "--focus", "east"]).exited;
      break;
    }
    case "left": {
      await Bun.spawn([config.yabaiPath, "-m", "window", "--focus", "west"]).exited;
      break;
    }
    default: {
      throw new Error(`Unsupported master position: ${String(config.masterPosition)}`);
    }
  }
});
