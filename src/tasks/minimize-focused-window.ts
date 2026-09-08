import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const minimizeFocusedWindow = defineTask(async () => {
  const { wm } = await createInitializedWindowsManager();
  const focused = wm.getFocusedWindow();
  if (!focused) return;
  const masters = wm.getMasterWindows().sort((a, b) => a.frame.y - b.frame.y);
  const stacks = wm.getStackWindows().sort((a, b) => a.frame.y - b.frame.y);
  const column = wm.windowsData.some((w) => w.id === focused.id)
    ? wm.isMasterWindow(focused)
      ? masters
      : stacks
    : [];
  const index = column.findIndex((w) => w.id === focused.id);
  const target =
    index < 0
      ? undefined
      : (column[index - 1] ??
        column[index + 1] ??
        (wm.isMasterWindow(focused) ? stacks.at(-1) : masters[0]));
  await wm.executeYabaiCommand(`-m window ${focused.id} --minimize`);
  await wm.updateWindows({ targetNumMasterWindows: wm.expectedCurrentNumMasterWindows });
  if (target) await wm.executeYabaiCommand(`-m window --focus ${target.id}`);
});
