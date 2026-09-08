import { defineTask } from "#utils/task.ts";
import { runYabai } from "#utils/yabai.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const focusSpace = defineTask(async (spaceIndex: number) => {
  if (!Number.isInteger(spaceIndex) || spaceIndex < 1)
    throw new Error("Space index must be a positive integer");
  const { wm } = await createInitializedWindowsManager(spaceIndex);
  await runYabai("space", "--focus", String(spaceIndex));
  await wm.refreshWindowsData();
  const top = wm.getTopMasterWindow();
  if (top) await wm.executeYabaiCommand(`-m window --focus ${top.id}`);
});
