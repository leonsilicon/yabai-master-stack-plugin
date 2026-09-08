import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const focusMasterWindow = defineTask(async (runtime: YMSPRuntime) => {
  const { wm } = await createInitializedWindowsManager(runtime);
  const top = wm.getTopMasterWindow();
  if (top) await wm.executeYabaiCommand(`-m window --focus ${top.id}`);
});
