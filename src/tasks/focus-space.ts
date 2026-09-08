import type { YMSPRuntime } from "#utils/runtime.ts";
import { workspaceTarget } from "#utils/workspace-target.ts";
import { defineTask } from "#utils/task.ts";
import { runWindowManager, usesAerospace } from "#utils/window-manager-backend.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const focusSpace = defineTask(async (runtime: YMSPRuntime, spaceIndex: number | string) => {
  spaceIndex = workspaceTarget(runtime, spaceIndex);
  if (usesAerospace(runtime))
    await runWindowManager(runtime, "space", "--focus", String(spaceIndex));
  const { wm } = await createInitializedWindowsManager(runtime, spaceIndex);
  if (!usesAerospace(runtime))
    await runWindowManager(runtime, "space", "--focus", String(spaceIndex));
  await wm.refreshWindowsData();
  const top = wm.getTopMasterWindow();
  if (top) await wm.executeYabaiCommand(`-m window --focus ${top.id}`);
});
