import type { YMSPRuntime } from "#utils/runtime.ts";
import { defineTask } from "#utils/task.ts";
import { writeState } from "#utils/state.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const decreaseMasterWindowCount = defineTask(async (runtime: YMSPRuntime) => {
  const { wm, state, space } = await createInitializedWindowsManager(runtime);
  const count = Math.max(1, state[space.id].numMasterWindows + -1);
  state[space.id].numMasterWindows = count;
  writeState(runtime, state);
  wm.expectedCurrentNumMasterWindows = count;
  await wm.relayoutWindows();
});
