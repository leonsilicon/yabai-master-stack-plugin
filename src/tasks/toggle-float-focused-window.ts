import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const toggleFloatFocusedWindow = defineTask(async (runtime: YMSPRuntime) => {
  const { wm } = await createInitializedWindowsManager(runtime);
  const focused = wm.getFocusedWindow();
  if (!focused) return;
  if (focused["is-floating"]) {
    const top = wm.getTopStackWindow();
    if (top) await wm.executeYabaiCommand(`-m window ${top.id} --insert north`);
  }
  await wm.executeYabaiCommand(`-m window ${focused.id} --toggle float`);
  await wm.updateWindows({ targetNumMasterWindows: wm.expectedCurrentNumMasterWindows });
});
