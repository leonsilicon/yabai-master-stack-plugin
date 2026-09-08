import { workspaceTarget } from "#utils/workspace-target.ts";
import { withAerospaceWorkspace } from "#utils/aerospace.ts";
import { rebuildAerospace } from "#utils/aerospace-layout.ts";
import { defineTask } from "#utils/task.ts";
import {
  queryFocusedWindow,
  runWindowManager,
  usesAerospace,
} from "#utils/window-manager-backend.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const moveWindowToSpace = defineTask(async (spaceIndex: number | string) => {
  spaceIndex = workspaceTarget(spaceIndex);
  const window = await queryFocusedWindow();
  if (!window || window.space === spaceIndex) return;
  const move = async () => {
    const { wm: destination } = await createInitializedWindowsManager(spaceIndex);
    const oldMasters = destination.getMasterWindows().sort((a, b) => a.frame.y - b.frame.y);
    const oldStacks = destination.getStackWindows().sort((a, b) => a.frame.y - b.frame.y);
    await runWindowManager("window", String(window.id), "--space", String(spaceIndex));
    await destination.refreshWindowsData();
    const moved = destination.windowsData.find((w) => w.id === window.id);
    if (moved && usesAerospace()) {
      const order = [...oldMasters, moved, ...oldStacks];
      const count = Math.min(order.length, destination.expectedCurrentNumMasterWindows);
      await rebuildAerospace(destination, order.slice(0, count), order.slice(count));
    } else if (moved) await destination.moveWindowToStack(moved);
    await destination.updateWindows({
      targetNumMasterWindows: destination.expectedCurrentNumMasterWindows,
    });
  };
  if (usesAerospace()) await withAerospaceWorkspace(spaceIndex, move);
  else await move();
  const { wm: source } = await createInitializedWindowsManager(window.space);
  await source.updateWindows({ targetNumMasterWindows: source.expectedCurrentNumMasterWindows });
});
