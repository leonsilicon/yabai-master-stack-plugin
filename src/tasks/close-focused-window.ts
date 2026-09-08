import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const closeFocusedWindow = defineTask(async () => {
  const { wm } = await createInitializedWindowsManager();
  const focused = wm.getFocusedWindow();
  if (!focused) return;
  const masters = wm.getMasterWindows().sort((a, b) => a.frame.y - b.frame.y);
  const stacks = wm.getStackWindows().sort((a, b) => a.frame.y - b.frame.y);
  const tiled = wm.windowsData.some((w) => w.id === focused.id);
  let target;
  if (tiled && wm.isMasterWindow(focused)) {
    if (masters.length === 1) {
      target = stacks[0];
      if (target) await wm.executeYabaiCommand(`-m window ${focused.id} --swap ${target.id}`);
      await wm.executeYabaiCommand(`-m window ${focused.id} --close`);
    } else {
      await wm.executeYabaiCommand(`-m window ${focused.id} --close`);
      const bottom = wm.getBottomMasterWindow();
      const promote = wm.getBottomStackWindow();
      if (bottom && promote) {
        await wm.executeYabaiCommand(`-m window ${bottom.id} --insert south`);
        await wm.executeYabaiCommand(`-m window ${promote.id} --warp ${bottom.id}`);
      }
    }
  } else {
    if (tiled) {
      const index = stacks.findIndex((w) => w.id === focused.id);
      target = stacks.length === 1 ? masters.at(-1) : (stacks[index + 1] ?? stacks[index - 1]);
    }
    await wm.executeYabaiCommand(`-m window ${focused.id} --close`);
  }
  await wm.updateWindows({ targetNumMasterWindows: wm.expectedCurrentNumMasterWindows });
  if (target) await wm.executeYabaiCommand(`-m window --focus ${target.id}`);
  if (wm.windowsData.length === 1) await wm.executeYabaiCommand("-m config split_type vertical");
});
