import { getConfig } from "#utils/config.ts";
import { defineTask } from "#utils/task.ts";

export const moveWindowToMaster = defineTask(async () => {
  const config = await getConfig();
  switch (config.masterPosition) {
    case "right": {
      await Bun.spawn(["yabai", "-m", "display", "--swap", "east"]);
    }
    case "left": {
      await Bun.spawn(["yabai", "-m", "display", "--swap", "west"]);
    }
    default: {
      throw new Error(`Unsupported master position: ${config.masterPosition}`);
    }
  }
});
