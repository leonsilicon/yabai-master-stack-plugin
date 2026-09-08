import type { YMSPRuntime } from "#utils/runtime.ts";
import { getDisplays, getFocusedDisplay } from "./display.ts";
import { queryWindows, queryFocusedWindow, runWindowManager } from "./window-manager-backend.ts";
import { createInitializedWindowsManager } from "./windows-manager.ts";

export async function navigateDisplay(runtime: YMSPRuntime, direction: 1 | -1, move: boolean) {
  const displays = (await getDisplays(runtime)).sort(
    (a, b) => a.frame.x - b.frame.x || a.frame.y - b.frame.y,
  );
  const focused = await getFocusedDisplay(runtime);
  const index = displays.findIndex((d) => d.id === focused.id);
  if (index < 0 || displays.length < 2) return;
  const target = displays[(index + direction + displays.length) % displays.length];
  if (!move) {
    await runWindowManager(runtime, "display", "--focus", String(target.index));
    return;
  }
  const window = await queryFocusedWindow(runtime);
  if (!window) return;
  await runWindowManager(runtime, "window", String(window.id), "--display", String(target.index));
  const moved = (await queryWindows(runtime)).find((w) => w.id === window.id);
  for (const spaceIndex of new Set([window.space, moved?.space])) {
    if (spaceIndex === undefined) continue;
    const { wm } = await createInitializedWindowsManager(runtime, spaceIndex);
    await wm.updateWindows({ targetNumMasterWindows: wm.expectedCurrentNumMasterWindows });
  }
}
