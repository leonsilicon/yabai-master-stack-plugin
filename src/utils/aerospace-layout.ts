import type { Window } from "#types";
import type { WindowsManager } from "./windows-manager/class.ts";
import { getConfig } from "./config.ts";
import { runAerospace, queryAerospaceWindows } from "./aerospace.ts";
import { assertTaskLock } from "./task-context.ts";

/** Use native containers, leaving user-floating windows out of the rebuild. */
export async function rebuildAerospace(wm: WindowsManager, masters: Window[], stacks: Window[]) {
  assertTaskLock(wm.runtime);
  if (wm.space.type && wm.space.type !== "bsp") return;
  const columns =
    getConfig(wm.runtime).masterPosition === "left" ? [masters, stacks] : [stacks, masters];
  const ordered = columns.flat();
  if (!ordered.length) return;
  const workspace = String(wm.space.index);
  const focused = (await queryAerospaceWindows(wm.runtime, true))[0];
  try {
    await runAerospace(wm.runtime, "flatten-workspace-tree", "--workspace", workspace);
    await runAerospace(wm.runtime, "layout", "--workspace", workspace, "--root", "h_tiles");
    // Moving each window to the left edge in reverse order is deterministic even
    // when the previous tree was malformed. Never cross workspace boundaries.
    for (const window of [...ordered].reverse()) {
      for (let i = 1; i < ordered.length; i++) {
        await runAerospace(
          wm.runtime,
          "move",
          "--window-id",
          String(window.id),
          "--boundaries",
          "workspace",
          "--boundaries-action",
          "stop",
          "left",
        );
      }
    }
    if (columns.some((c) => c.length === ordered.length)) {
      await runAerospace(wm.runtime, "layout", "--workspace", workspace, "--root", "v_tiles");
    } else {
      for (const column of columns) {
        if (column.length < 2) continue;
        await runAerospace(wm.runtime, "join-with", "--window-id", String(column[1].id), "left");
        for (let i = 2; i < column.length; i++) {
          const id = String(column[i].id);
          await runAerospace(wm.runtime, "focus", "--window-id", String(column[i - 1].id));
          await runAerospace(wm.runtime, "move", "--window-id", id, "left");
        }
      }
    }
    await runAerospace(wm.runtime, "balance-sizes", "--workspace", workspace);
  } finally {
    if (focused) await runAerospace(wm.runtime, "focus", "--window-id", String(focused.id));
  }
  await wm.refreshWindowsData();
}

async function insertWindow(wm: WindowsManager, id: number) {
  const insertion = wm.insertion;
  delete wm.insertion;
  if (!insertion || insertion.id === id) return;
  await wm.refreshWindowsData();
  const moving = wm.windowsData.find((w) => w.id === id);
  const anchor = wm.windowsData.find((w) => w.id === insertion.id);
  if (!moving || !anchor) return;
  // Tiling a floating window can change the root orientation and every frame.
  // Use the columns captured before insertion, not that intermediate layout.
  const resolve = (ids: number[]) =>
    ids.flatMap((saved) => {
      const window = wm.windowsData.find((w) => w.id === saved && w.id !== id);
      return window ? [window] : [];
    });
  const masters = resolve(insertion.masters);
  const stacks = resolve(insertion.stacks);
  const column = insertion.masters.includes(anchor.id) ? masters : stacks;
  column.splice(
    column.findIndex((w) => w.id === anchor.id) + (insertion.direction === "south" ? 1 : 0),
    0,
    moving,
  );
  await rebuildAerospace(wm, masters, stacks);
}

export async function executeAerospaceCommand(wm: WindowsManager, args: string[]): Promise<string> {
  assertTaskLock(wm.runtime);
  if (args[0] === "-m") args = args.slice(1);
  // split_type is a yabai insertion hint; AeroSpace rebuilds explicit containers.
  if (args[0] === "config" && args[1] === "split_type") return "";
  if (args[0] !== "window") throw new Error(`Unsupported AeroSpace command: ${args.join(" ")}`);
  if (args[1] === "--focus") return runAerospace(wm.runtime, "focus", "--window-id", args[2]);
  const id = args[1];
  const [action, value] = args.slice(2);
  if (action === "--insert") {
    wm.insertion = {
      id: Number(id),
      direction: value,
      masters: wm
        .getMasterWindows()
        .sort((a, b) => a.frame.y - b.frame.y)
        .map((w) => w.id),
      stacks: wm
        .getStackWindows()
        .sort((a, b) => a.frame.y - b.frame.y)
        .map((w) => w.id),
    };
    return "";
  }
  if (action === "--close") return runAerospace(wm.runtime, "close", "--window-id", id);
  if (action === "--minimize")
    return runAerospace(wm.runtime, "macos-native-minimize", "--window-id", id);
  if (action === "--toggle" && value === "float") {
    const window = wm.allWindowsData.find((w) => w.id === Number(id));
    const tiling = window?.["is-floating"];
    await runAerospace(wm.runtime, "layout", "--window-id", id, tiling ? "tiling" : "floating");
    if (tiling) await insertWindow(wm, Number(id));
    return "";
  }
  if (action === "--toggle" && value === "split")
    return runAerospace(wm.runtime, "layout", "--window-id", id, "horizontal", "vertical");
  if (action === "--warp") {
    await insertWindow(wm, Number(id));
    return "";
  }
  if (action === "--swap") {
    // AeroSpace has directional swaps, not swap-by-ID. Adjacent DFS swaps
    // implement a transposition without rebuilding or resetting proportions.
    const order = [...wm.windowsData]
      .sort((a, b) => a.frame.x - b.frame.x || a.frame.y - b.frame.y)
      .map((w) => w.id);
    let a = order.indexOf(Number(id)),
      b = order.indexOf(Number(value));
    if (a < 0 || b < 0) throw new Error("Cannot swap non-tiled AeroSpace windows");
    if (a > b) [a, b] = [b, a];
    for (let i = a; i < b; i++) {
      await runAerospace(wm.runtime, "swap", "--window-id", String(order[i]), "dfs-next");
      [order[i], order[i + 1]] = [order[i + 1], order[i]];
    }
    for (let i = b - 1; i > a; i--) {
      await runAerospace(wm.runtime, "swap", "--window-id", String(order[i]), "dfs-prev");
      [order[i], order[i - 1]] = [order[i - 1], order[i]];
    }
    return "";
  }
  if (action === "--resize") {
    const [edge, x, y] = value.split(":");
    const width = edge === "left" || edge === "right";
    const delta = Number(width ? x : y) * (edge === "left" || edge === "top" ? -1 : 1);
    if (!width) {
      const window = wm.windowsData.find((w) => w.id === Number(id));
      if (!window) return "";
      const column = (
        wm.isMasterWindow(window) ? wm.getMasterWindows() : wm.getStackWindows()
      ).sort((a, b) => a.frame.y - b.frame.y);
      if (column.length < 2) return "";
      const index = column.findIndex((w) => w.id === window.id);
      const neighbor = column[index === 0 ? 1 : index - 1];
      // AeroSpace spreads resize deltas across all siblings. Two opposing
      // resizes keep the other siblings unchanged (within integer rounding).
      const amount = Math.round((delta * (column.length - 1)) / column.length);
      const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;
      await runAerospace(wm.runtime, "resize", "--window-id", id, "height", signed(amount));
      return runAerospace(
        wm.runtime,
        "resize",
        "--window-id",
        String(neighbor.id),
        "height",
        signed(-amount),
      );
    }
    return runAerospace(
      wm.runtime,
      "resize",
      "--window-id",
      id,
      width ? "width" : "height",
      `${delta >= 0 ? "+" : ""}${delta}`,
    );
  }
  throw new Error(`Unsupported AeroSpace command: ${args.join(" ")}`);
}
