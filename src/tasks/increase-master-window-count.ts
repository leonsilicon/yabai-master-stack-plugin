import { defineTask } from "#utils/task.ts";
import { writeState } from "#utils/state.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
export const increaseMasterWindowCount = defineTask(async () => {
  const { wm, state, space } = await createInitializedWindowsManager();
  const count = Math.max(1, state[space.id].numMasterWindows + 1);
  state[space.id].numMasterWindows = count;
  writeState(state);
  wm.expectedCurrentNumMasterWindows = count;
  await wm.relayoutWindows();
});
