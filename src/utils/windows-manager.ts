import type { YMSPRuntime } from "#utils/runtime.ts";
import { usesAerospace } from "./window-manager-backend.ts";
import { getDisplays, getFocusedDisplay } from "#utils/display.ts";
import { getSpaces, getFocusedSpace } from "#utils/space.ts";
import { readState } from "#utils/state.ts";
import { WindowsManager } from "#utils/windows-manager/class.ts";
import invariant from "tiny-invariant";

export async function createInitializedWindowsManager(
  runtime: YMSPRuntime,
  spaceIndex?: number | string,
) {
  if (spaceIndex !== undefined && usesAerospace(runtime)) spaceIndex = String(spaceIndex);
  const state = await readState(runtime);
  const space =
    spaceIndex === undefined
      ? await getFocusedSpace(runtime)
      : (await getSpaces(runtime)).find((s) => s.index === spaceIndex);
  invariant(space, `Space ${spaceIndex} not found`);
  const display =
    spaceIndex === undefined
      ? await getFocusedDisplay(runtime)
      : (await getDisplays(runtime)).find((d) => d.index === space.display);
  invariant(display, `Display for space ${space.index} not found`);
  const spaceState = state[space.id];
  invariant(spaceState);
  const wm = new WindowsManager({
    runtime,
    display,
    space,
    expectedCurrentNumMasterWindows: spaceState.numMasterWindows,
  });
  await wm.initialize();
  wm.validateState(state);
  return { wm, state, display, space };
}
