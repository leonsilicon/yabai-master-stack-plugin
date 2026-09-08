import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DesktopGeometry } from "../src/utils/macos-geometry.ts";
const mocks = vi.hoisted(() => ({
  config: {
    windowManager: "aerospace" as "aerospace" | "yabai",
    aerospacePath: "/custom/aerospace",
    yabaiPath: "/custom/yabai",
  },
  spawn: vi.fn(),
  geometry: vi.fn(),
}));
vi.mock("../src/utils/config.ts", () => ({ getConfig: () => mocks.config }));
vi.mock("../src/utils/macos-geometry.ts", () => ({ getDesktopGeometry: mocks.geometry }));
import {
  AerospaceError,
  getAerospaceDisplays,
  getAerospaceSpaces,
  queryAerospaceWindows,
  runAerospace,
  withAerospaceWorkspace,
} from "../src/utils/aerospace.ts";
import { queryWindows, runWindowManager } from "../src/utils/window-manager-backend.ts";
import { workspaceTarget } from "../src/utils/workspace-target.ts";

function output(value: unknown, code = 0, stderr = "") {
  return {
    stdout: new Response(typeof value === "string" ? value : JSON.stringify(value)).body!,
    stderr: new Response(stderr).body!,
    exited: Promise.resolve(code),
  };
}
const workspace = (name: string, visible = true) => ({
  workspace: name,
  "monitor-id": 2,
  "workspace-is-focused": visible,
  "workspace-is-visible": visible,
  "workspace-root-container-layout": "h_tiles",
});
const row = (layout = "v_tiles") => ({
  ...workspace("Work"),
  "window-id": 42,
  "app-pid": 100,
  "app-name": "Test",
  "window-title": 'Quotes " and 日本語',
  "window-layout": layout,
  "window-is-fullscreen": false,
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.windowManager = "aerospace";
  mocks.spawn.mockImplementation(() => output([]));
  mocks.geometry.mockResolvedValue({
    displays: [
      { id: 1, x: 0, y: 0, w: 1920, h: 1080 },
      { id: 2, x: -1200, y: -100, w: 1200, h: 900 },
    ],
    windows: [{ id: 42, frame: { X: -1200, Y: -75, Width: 600, Height: 800 } }],
  } satisfies DesktopGeometry);
  vi.stubGlobal("Bun", { spawn: mocks.spawn });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("AeroSpace 0.21.3 CLI contract", () => {
  test("selects the configured executable and isolates callback target variables", async () => {
    vi.stubEnv("AEROSPACE_WINDOW_ID", "999");
    vi.stubEnv("AEROSPACE_WORKSPACE", "Elsewhere");
    mocks.spawn.mockImplementation(() => output("ok"));
    expect(await runAerospace("focus", "--window-id", "42")).toBe("ok");
    const [argv, options] = mocks.spawn.mock.calls[0];
    expect(argv).toEqual(["/custom/aerospace", "focus", "--window-id", "42"]);
    expect(options.env.AEROSPACE_WINDOW_ID).toBeUndefined();
    expect(options.env.AEROSPACE_WORKSPACE).toBeUndefined();
    expect(process.env.AEROSPACE_WINDOW_ID).toBe("999");
  });
  test("drains stderr and preserves failure status", async () => {
    mocks.spawn.mockImplementation(() => output("", 7, "server unavailable"));
    await expect(runAerospace("list-windows", "--all")).rejects.toMatchObject({
      name: "AerospaceError",
      exitCode: 7,
      stderr: "server unavailable",
    });
  });
  test("only the documented no-focus error becomes an empty result", async () => {
    mocks.spawn.mockImplementation(() => output("", 1, "No window is focused"));
    expect(await queryAerospaceWindows(true)).toEqual([]);
    await expect(queryAerospaceWindows()).rejects.toBeInstanceOf(AerospaceError);
    mocks.spawn.mockImplementation(() => output("", 1, "Connection refused"));
    await expect(queryAerospaceWindows(true)).rejects.toThrow("Connection refused");
  });
  test("maps native geometry and workspace names without losing Unicode titles", async () => {
    mocks.spawn.mockImplementation(() => output([row()]));
    expect((await queryWindows())[0]).toMatchObject({
      id: 42,
      pid: 100,
      title: 'Quotes " and 日本語',
      space: "Work",
      display: 2,
      frame: { x: -1200, y: -75, w: 600, h: 800 },
      "is-floating": false,
      "is-visible": true,
    });
    expect(mocks.spawn.mock.calls[0][0]).toContain("list-windows");
    expect(mocks.spawn.mock.calls[0][0]).not.toContain("query");
  });
  test.each([
    ["floating", "is-floating"],
    ["macos_native_minimized", "is-minimized"],
    ["macos_native_fullscreen", "is-native-fullscreen"],
    ["macos_native_window_of_hidden_app", "is-hidden"],
  ])("excludes %s from ordinary tiling", async (layout, flag) => {
    mocks.spawn.mockImplementation(() => output([row(layout)]));
    expect((await queryAerospaceWindows())[0][flag as "is-floating"]).toBe(true);
  });
  test("excludes AeroSpace fullscreen and reports missing geometry instead of inventing it", async () => {
    mocks.spawn.mockImplementation(() => output([{ ...row(), "window-is-fullscreen": true }]));
    expect((await queryAerospaceWindows())[0]["is-native-fullscreen"]).toBe(true);
    mocks.geometry.mockResolvedValue({ displays: [], windows: [] });
    await expect(queryAerospaceWindows()).rejects.toThrow("No macOS geometry");
  });
  test("workspace identity is the exact name, and accordion workspaces are protected", async () => {
    mocks.spawn.mockImplementation(() =>
      output([
        workspace("1"),
        workspace("01"),
        { ...workspace("Work"), "workspace-root-container-layout": "v_accordion" },
      ]),
    );
    expect((await getAerospaceSpaces()).map((s) => [s.id, s.index, s.type])).toEqual([
      ["1", "1", "bsp"],
      ["01", "01", "bsp"],
      ["Work", "Work", "stack"],
    ]);
  });
  test("retries a window that closes between the CLI and geometry snapshots", async () => {
    mocks.spawn
      .mockImplementationOnce(() => output([row()]))
      .mockImplementationOnce(() => output([]));
    mocks.geometry.mockResolvedValue({ displays: [], windows: [] });
    expect(await queryAerospaceWindows()).toEqual([]);
    expect(mocks.spawn).toHaveBeenCalledTimes(2);
  });
  test("maps monitors through NSScreen identity, including negative coordinates", async () => {
    mocks.spawn.mockImplementation(() =>
      output([{ "monitor-id": 1, "monitor-appkit-nsscreen-screens-id": 2 }]),
    );
    expect((await getAerospaceDisplays())[0]).toMatchObject({
      id: 1,
      index: 1,
      frame: { x: -1200, y: -100, w: 1200, h: 900 },
    });
  });
  test.each([
    [
      ["space", "--focus", "Work"],
      ["workspace", "--", "Work"],
    ],
    [
      ["display", "--focus", "2"],
      ["focus-monitor", "2"],
    ],
    [
      ["window", "42", "--space", "Work ' quotes"],
      ["move-node-to-workspace", "--window-id", "42", "--", "Work ' quotes"],
    ],
    [
      ["window", "42", "--display", "2"],
      ["move-node-to-monitor", "--window-id", "42", "2"],
    ],
  ])("routes %j to supported commands", async (input, expected) => {
    await runWindowManager(...input);
    expect(mocks.spawn.mock.calls[0][0]).toEqual(["/custom/aerospace", ...expected]);
  });
  test("rejects unsupported operations explicitly", async () => {
    await expect(runWindowManager("window", "42", "--grid", "1:1")).rejects.toThrow(
      "Unsupported AeroSpace",
    );
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
  test("leaves the legacy backend unchanged", async () => {
    mocks.config.windowManager = "yabai";
    await runWindowManager("space", "--focus", "2");
    expect(mocks.spawn.mock.calls[0][0]).toEqual(["/custom/yabai", "-m", "space", "--focus", "2"]);
  });
  test("restores the workspace after failure without refocusing a window moved away", async () => {
    mocks.spawn.mockImplementation((argv: string[]) => {
      if (argv[1] === "list-workspaces")
        return output([workspace("Source"), workspace("Destination", false)]);
      if (argv[1] === "list-windows")
        return output([
          { ...row(), workspace: argv.includes("--focused") ? "Source" : "Destination" },
        ]);
      return output("");
    });
    await expect(
      withAerospaceWorkspace("Destination", async () => {
        throw new Error("repair failure");
      }),
    ).rejects.toThrow("repair failure");
    const commands = mocks.spawn.mock.calls.map((c) => c[0]);
    expect(commands).toContainEqual(["/custom/aerospace", "workspace", "--", "Source"]);
    expect(commands.some((c) => c[1] === "focus")).toBe(false);
  });
  test("accepts named/numeric workspaces while keeping yabai indices strict", () => {
    expect(workspaceTarget(1)).toBe("1");
    expect(workspaceTarget("Work")).toBe("Work");
    expect(() => workspaceTarget("")).toThrow();
    expect(() => workspaceTarget("a\nb")).toThrow();
    mocks.config.windowManager = "yabai";
    expect(workspaceTarget(1)).toBe(1);
    expect(() => workspaceTarget("Work")).toThrow();
    expect(() => workspaceTarget(0)).toThrow();
  });
});
