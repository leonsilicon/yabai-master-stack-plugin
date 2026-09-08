import { usesAerospace } from "./window-manager-backend.ts";
import { getDisplays, getFocusedDisplay } from "#utils/display.ts";
import { getSpaces, getFocusedSpace } from "#utils/space.ts";
import { readState } from "#utils/state.ts";
import { WindowsManager } from "#utils/windows-manager/class.ts";
import invariant from "tiny-invariant";

export async function createInitializedWindowsManager(spaceIndex?: number | string) {
  if (spaceIndex !== undefined && usesAerospace()) spaceIndex = String(spaceIndex);
  const state = await readState();
  const space =
    spaceIndex === undefined
      ? await getFocusedSpace()
      : (await getSpaces()).find((s) => s.index === spaceIndex);
  invariant(space, `Space ${spaceIndex} not found`);
  const display =
    spaceIndex === undefined
      ? await getFocusedDisplay()
      : (await getDisplays()).find((d) => d.index === space.display);
  invariant(display, `Display for space ${space.index} not found`);
  const spaceState = state[space.id];
  invariant(spaceState);
  const wm = new WindowsManager({
    display,
    space,
    expectedCurrentNumMasterWindows: spaceState.numMasterWindows,
  });
  await wm.initialize();
  wm.validateState(state);
  return { wm, state, display, space };
}
