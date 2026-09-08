import { usesAerospace } from "#utils/window-manager-backend.ts";
import { rebuildAerospace } from "#utils/aerospace-layout.ts";
import { getConfig } from "#utils/config.ts";
import type { Window } from "#types";
import type { WindowsManager } from "#utils/windows-manager/class.ts";

function hasAerospaceFullscreen(wm: WindowsManager) {
  return (
    usesAerospace(wm.runtime) &&
    wm.allWindowsData.some(
      (w) => w.space === wm.space.index && w["is-native-fullscreen"] && !w["is-hidden"],
    )
  );
}

export async function isValidLayout(
  this: WindowsManager,
  args?: { targetNumMasterWindows?: number },
): Promise<{ status: true } | { status: false; reason: string }> {
  const windows = this.windowsData;
  if (!windows.length) return { status: true };
  const target = Math.min(
    windows.length,
    Math.max(1, args?.targetNumMasterWindows ?? this.expectedCurrentNumMasterWindows),
  );
  const masters = this.getMasterWindows();
  const stacks = this.getStackWindows();
  if (masters.length !== target)
    return { status: false, reason: `Expected ${target} master windows, found ${masters.length}` };
  // Each column must have the same left AND right edges. This also catches a
  // nested third column or a full-width window above two columns.
  for (const column of [masters, stacks]) {
    if (
      column.some(
        (w) => w.frame.x !== column[0].frame.x || Math.abs(w.frame.w - column[0].frame.w) > 1,
      )
    ) {
      return { status: false, reason: "Windows do not form two vertical columns" };
    }
  }
  return { status: true };
}

/** Rebuild the BSP tree around a chosen top master, preserving vertical order. */
export async function relayoutWindows(this: WindowsManager, topMasterWindow?: Window) {
  if (this.space.type && this.space.type !== "bsp") return;
  if (hasAerospaceFullscreen(this)) return;
  const top = topMasterWindow ?? this.getTopMasterWindow();
  if (!top || !this.windowsData.some((w) => w.id === top.id)) return;
  const count = Math.min(
    this.windowsData.length,
    Math.max(1, this.expectedCurrentNumMasterWindows),
  );
  const rest = this.windowsData
    .filter((w) => w.id !== top.id)
    .sort((a, b) => a.frame.y - b.frame.y);
  const masters = rest.slice(0, count - 1);
  const stacks = rest.slice(count - 1);
  if (usesAerospace(this.runtime)) return rebuildAerospace(this, [top, ...masters], stacks);
  const floated = new Set<number>();
  try {
    for (const window of rest) {
      floated.add(window.id);
      await this.setWindowFloating(window.id, true);
    }
    if (stacks[0]) {
      await this.executeYabaiCommand(
        `-m window ${top.id} --insert ${getConfig(this.runtime).masterPosition === "right" ? "west" : "east"}`,
      );
      await this.setWindowFloating(stacks[0].id, false);
      floated.delete(stacks[0].id);
    }
    for (const [anchor, column] of [
      [top, masters],
      [stacks[0], stacks.slice(1)],
    ] as const) {
      let previous = anchor;
      for (const window of column) {
        if (!previous) break;
        await this.executeYabaiCommand(`-m window ${previous.id} --insert south`);
        await this.setWindowFloating(window.id, false);
        floated.delete(window.id);
        previous = window;
      }
    }
  } finally {
    // A failed command must not strand the rest of the desktop floating.
    for (const id of floated) {
      await this.setWindowFloating(id, false).catch(() => {});
    }
  }
}

export async function updateWindows(
  this: WindowsManager,
  { targetNumMasterWindows }: { targetNumMasterWindows: number },
) {
  this.expectedCurrentNumMasterWindows = Math.max(1, targetNumMasterWindows);
  if (this.space.type && this.space.type !== "bsp") return;
  if (hasAerospaceFullscreen(this)) return;
  if (!(await this.isValidLayout()).status) {
    await this.relayoutWindows();
    const result = await this.isValidLayout();
    if (!result.status) throw new Error(`Layout repair failed: ${result.reason}`);
  }
}
