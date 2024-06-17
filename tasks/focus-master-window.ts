import { getConfig } from "#utils/config.ts";
import { defineTask } from "#utils/task.ts";

export const focusMasterWindow = defineTask(async () => {
  const config = await getConfig();
  switch (config.masterPosition) {
    case "right": {
      await Bun.spawn(["yabai", "-m", "display", "--focus", "east"]);
    }
    case "left": {
      await Bun.spawn(["yabai", "-m", "display", "--focus", "west"]);
    }
    default: {
      throw new Error(`Unsupported master position: ${config.masterPosition}`);
    }
  }
});
