import { defineTask } from "#utils/task.ts";
import { queryFocusedWindow, runYabai } from "#utils/yabai.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const moveWindowToSpace = defineTask(async (spaceIndex: number) => {
  if (!Number.isInteger(spaceIndex) || spaceIndex < 1)
    throw new Error("Space index must be a positive integer");
  const window = await queryFocusedWindow();
  if (!window || window.space === spaceIndex) return;
  const { wm: destination } = await createInitializedWindowsManager(spaceIndex);
  await runYabai("window", String(window.id), "--space", String(spaceIndex));
  await destination.refreshWindowsData();
  const moved = destination.windowsData.find((w) => w.id === window.id);
  if (moved) await destination.moveWindowToStack(moved);
  await destination.updateWindows({
    targetNumMasterWindows: destination.expectedCurrentNumMasterWindows,
  });
  const { wm: source } = await createInitializedWindowsManager(window.space);
  await source.updateWindows({ targetNumMasterWindows: source.expectedCurrentNumMasterWindows });
});
