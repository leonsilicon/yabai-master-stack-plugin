import type { Window } from "#types";
import type { WindowsManager } from "#utils/windows-manager/class.ts";

export async function moveWindowToStack(this: WindowsManager, window: Window) {
  if (this.windowsData.length <= this.expectedCurrentNumMasterWindows) return;
  const top = this.getTopStackWindow();
  if (!top) {
    await this.relayoutWindows();
    return;
  }
  if (top.id === window.id) return;
  await this.executeYabaiCommand(`-m window ${top.id} --insert north`);
  await this.executeYabaiCommand(`-m window ${window.id} --warp ${top.id}`);
}
