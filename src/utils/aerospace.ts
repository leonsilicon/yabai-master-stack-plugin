import type { Display, Space, Window } from "#types";
import { getConfig } from "./config.ts";
import { getTaskSignal } from "./task-context.ts";
import { getDesktopGeometry } from "./macos-geometry.ts";

export class AerospaceError extends Error {
  constructor(
    public exitCode: number,
    public stdout: string,
    public stderr: string,
  ) {
    super(`AeroSpace command failed (${exitCode}): ${stderr || stdout}`);
    this.name = "AerospaceError";
  }
}

export async function runAerospace(...args: string[]): Promise<string> {
  const signal = getTaskSignal();
  // Callback target variables must not override authoritative focused queries.
  const env = { ...process.env };
  delete env.AEROSPACE_WINDOW_ID;
  delete env.AEROSPACE_WORKSPACE;
  const child = Bun.spawn([getConfig().aerospacePath ?? "/opt/homebrew/bin/aerospace", ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env,
    ...(signal ? { signal } : {}),
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0) throw new AerospaceError(code, stdout, stderr);
  getTaskSignal();
  return stdout;
}

const format = (keys: string[]) => keys.map((key) => `%{${key}}`).join(" ");
interface WorkspaceRow {
  workspace: string;
  "monitor-id": number;
  "workspace-is-focused": boolean;
  "workspace-is-visible": boolean;
  "workspace-root-container-layout": string;
}
interface WindowRow extends WorkspaceRow {
  "window-id": number;
  "app-pid": number;
  "app-name": string;
  "window-title": string;
  "window-layout": string;
  "window-is-fullscreen": boolean;
}
export async function getAerospaceSpaces(): Promise<Space[]> {
  const rows = JSON.parse(
    await runAerospace(
      "list-workspaces",
      "--all",
      "--json",
      "--format",
      format([
        "workspace",
        "monitor-id",
        "workspace-is-focused",
        "workspace-is-visible",
        "workspace-root-container-layout",
      ]),
    ),
  ) as WorkspaceRow[];
  return rows.map((row) => ({
    id: row.workspace as Space["id"],
    uuid: row.workspace,
    index: row.workspace,
    label: row.workspace,
    display: row["monitor-id"],
    type: row["workspace-root-container-layout"].endsWith("_tiles") ? "bsp" : "stack",
    windows: [],
    "first-window": 0,
    "last-window": 0,
    "has-focus": row["workspace-is-focused"],
    "is-visible": row["workspace-is-visible"],
    "is-native-fullscreen": 0,
  }));
}
export async function getAerospaceDisplays(focused = false): Promise<Display[]> {
  const rows = JSON.parse(
    await runAerospace(
      "list-monitors",
      ...(focused ? ["--focused"] : []),
      "--json",
      "--format",
      format(["monitor-id", "monitor-appkit-nsscreen-screens-id"]),
    ),
  ) as { "monitor-id": number; "monitor-appkit-nsscreen-screens-id": number }[];
  const geometry = await getDesktopGeometry();
  return rows.map((row) => {
    const frame = geometry.displays.find((d) => d.id === row["monitor-appkit-nsscreen-screens-id"]);
    if (!frame) throw new Error(`No macOS geometry for AeroSpace monitor ${row["monitor-id"]}`);
    return {
      id: row["monitor-id"] as Display["id"],
      index: row["monitor-id"] as Display["index"],
      uuid: row["monitor-id"] as Display["uuid"],
      frame,
      spaces: [],
    } as Display;
  });
}
export async function queryAerospaceWindows(focused = false): Promise<Window[]> {
  return readAerospaceWindows(focused, true);
}

async function readAerospaceWindows(focused: boolean, retry: boolean): Promise<Window[]> {
  let rows: WindowRow[];
  try {
    rows = JSON.parse(
      await runAerospace(
        "list-windows",
        focused ? "--focused" : "--all",
        "--json",
        "--format",
        format([
          "window-id",
          "app-pid",
          "app-name",
          "window-title",
          "workspace",
          "monitor-id",
          "window-layout",
          "window-is-fullscreen",
          "workspace-is-visible",
        ]),
      ),
    ) as WindowRow[];
  } catch (error) {
    if (focused && error instanceof AerospaceError && /No window is focused/.test(error.stderr))
      return [];
    throw error;
  }
  if (!rows.length) return [];
  const geometry = await getDesktopGeometry();
  // A window can close between the CLI snapshot and the WindowServer snapshot.
  // Retry once so the watcher survives that normal lifecycle race.
  if (
    retry &&
    rows.some(
      (row) =>
        ["h_tiles", "v_tiles", "h_accordion", "v_accordion", "floating"].includes(
          row["window-layout"],
        ) && !geometry.windows.some((w) => w.id === row["window-id"]),
    )
  )
    return readAerospaceWindows(focused, false);
  return rows.map((row) => {
    const frame = geometry.windows.find((w) => w.id === row["window-id"])?.frame;
    const layout = row["window-layout"];
    const excluded = !["h_tiles", "v_tiles", "h_accordion", "v_accordion", "floating"].includes(
      layout,
    );
    if (!frame && !excluded)
      throw new Error(`No macOS geometry for AeroSpace window ${row["window-id"]}`);
    return {
      id: row["window-id"],
      pid: row["app-pid"],
      app: row["app-name"],
      title: row["window-title"],
      frame: { x: frame?.X ?? 0, y: frame?.Y ?? 0, w: frame?.Width ?? 0, h: frame?.Height ?? 0 },
      space: row.workspace,
      display: row["monitor-id"],
      role: "AXWindow",
      subrole: "AXStandardWindow",
      "has-focus": focused,
      "is-floating": layout === "floating",
      "is-native-fullscreen": row["window-is-fullscreen"] || layout === "macos_native_fullscreen",
      "is-hidden": excluded,
      "is-minimized": layout === "macos_native_minimized",
      "is-visible": row["workspace-is-visible"] && !excluded,
      "split-type": layout.startsWith("h_") ? "vertical" : "horizontal",
    } as Window;
  });
}

/** Offscreen AeroSpace windows have parked frames. Visit a workspace for geometry
 * dependent repairs, then restore the user's workspace and focus even on failure. */
export async function withAerospaceWorkspace<T>(
  workspace: string | number,
  task: () => Promise<T>,
): Promise<T> {
  const spaces = await getAerospaceSpaces();
  const original = spaces.find((s) => s["has-focus"]);
  const target = spaces.find((s) => s.index === String(workspace));
  if (target?.["is-visible"]) return task();
  const focused = (await queryAerospaceWindows(true))[0];
  await runAerospace("workspace", "--", String(workspace));
  try {
    return await task();
  } finally {
    if (original) await runAerospace("workspace", "--", String(original.index));
    if (
      focused &&
      (await queryAerospaceWindows()).some(
        (w) => w.id === focused.id && w.space === original?.index,
      )
    )
      await runAerospace("focus", "--window-id", String(focused.id));
  }
}
