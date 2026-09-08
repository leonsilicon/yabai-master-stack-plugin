import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const focusMasterWindow = defineTask(async () => {
  const { wm } = await createInitializedWindowsManager();
  const top = wm.getTopMasterWindow();
  if (top) await wm.executeYabaiCommand(`-m window --focus ${top.id}`);
});
