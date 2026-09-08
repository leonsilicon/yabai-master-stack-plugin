import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const moveWindowToMaster = defineTask(async (runtime: YMSPRuntime) => {
  const { wm } = await createInitializedWindowsManager(runtime);
  const focused = wm.getFocusedWindow();
  const top = wm.getTopMasterWindow();
  if (focused && top && focused.id !== top.id && wm.windowsData.some((w) => w.id === focused.id)) {
    await wm.executeYabaiCommand(`-m window ${focused.id} --swap ${top.id}`);
  }
});
