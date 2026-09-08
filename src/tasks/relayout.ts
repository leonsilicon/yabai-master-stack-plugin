import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const relayout = defineTask(async () => {
  const { wm } = await createInitializedWindowsManager();
  const focused = wm.getFocusedWindow();
  await wm.relayoutWindows(
    wm.windowsData.find((w) => w.id === focused?.id) ?? wm.getTopMasterWindow(),
  );
});
