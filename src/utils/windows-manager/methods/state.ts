import type { State } from "#types";
import { writeState } from "#utils/state.ts";
import type { WindowsManager } from "#utils/windows-manager/class.ts";
import invariant from "tiny-invariant";

export function validateState(this: WindowsManager, state: State) {
  const spaceState = state[this.space.id];
  invariant(spaceState);

  if (!Number.isInteger(spaceState.numMasterWindows) || spaceState.numMasterWindows <= 0) {
    spaceState.numMasterWindows = 1;
  }

  this.expectedCurrentNumMasterWindows = spaceState.numMasterWindows;
  writeState(this.runtime, state);
}
