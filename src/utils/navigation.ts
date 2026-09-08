import { createInitializedWindowsManager } from "./windows-manager.ts";

export async function navigateWindow(direction: 1 | -1, swap: boolean) {
  const { wm } = await createInitializedWindowsManager();
  const focused = wm.getFocusedWindow();
  const masters = wm.getMasterWindows().sort((a, b) => a.frame.y - b.frame.y);
  const stacks = wm.getStackWindows().sort((a, b) => a.frame.y - b.frame.y);
  const ordered = [...masters, ...stacks];
  const index = ordered.findIndex((w) => w.id === focused?.id);
  const target =
    index < 0
      ? direction === 1
        ? masters[0]
        : masters.at(-1)
      : ordered[(index + direction + ordered.length) % ordered.length];
  if (!target || target.id === focused?.id || (swap && !focused)) return;
  await wm.executeYabaiCommand(
    swap ? `-m window ${focused!.id} --swap ${target.id}` : `-m window --focus ${target.id}`,
  );
}
