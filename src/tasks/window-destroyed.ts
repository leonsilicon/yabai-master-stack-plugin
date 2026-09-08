import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
import { getSpaces } from "#utils/space.ts";

export const windowDestroyed = defineTask(async (runtime: YMSPRuntime) => {
  // Destroyed IDs are no longer queryable. Repair visible BSP spaces, including
  // the other monitor, rather than assuming focus stayed on the source space.
  for (const space of await getSpaces(runtime)) {
    if (!space["is-visible"] || space.type !== "bsp") continue;
    const { wm } = await createInitializedWindowsManager(runtime, space.index);
    await wm.updateWindows({ targetNumMasterWindows: wm.expectedCurrentNumMasterWindows });
  }
});
