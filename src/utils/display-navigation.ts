import { getDisplays, getFocusedDisplay } from "./display.ts";
import { queryWindows, queryFocusedWindow, runYabai } from "./yabai.ts";
import { createInitializedWindowsManager } from "./windows-manager.ts";

export async function navigateDisplay(direction: 1 | -1, move: boolean) {
  const displays = (await getDisplays()).sort(
    (a, b) => a.frame.x - b.frame.x || a.frame.y - b.frame.y,
  );
  const focused = await getFocusedDisplay();
  const index = displays.findIndex((d) => d.id === focused.id);
  if (index < 0 || displays.length < 2) return;
  const target = displays[(index + direction + displays.length) % displays.length];
  if (!move) {
    await runYabai("display", "--focus", String(target.index));
    return;
  }
  const window = await queryFocusedWindow();
  if (!window) return;
  await runYabai("window", String(window.id), "--display", String(target.index));
  const moved = (await queryWindows()).find((w) => w.id === window.id);
  for (const spaceIndex of new Set([window.space, moved?.space])) {
    if (spaceIndex === undefined) continue;
    const { wm } = await createInitializedWindowsManager(spaceIndex);
    await wm.updateWindows({ targetNumMasterWindows: wm.expectedCurrentNumMasterWindows });
  }
}
