import { YMSPRuntime } from "../src/utils/runtime.ts";
const runtime = new YMSPRuntime();
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import type { Display, Space, Window } from "../src/+.ts";

const mocks = vi.hoisted(() => ({
  config: {
    yabaiPath: "/custom/yabai",
    masterPosition: "right" as "left" | "right",
    debug: false,
    moveNewWindowsToMaster: false,
  },
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  rmSync: vi.fn(),
  spawn: vi.fn(),
  assertTaskLock: vi.fn(),
}));
vi.mock("../src/utils/task-context.ts", async (original) => ({
  ...(await original<typeof import("../src/utils/task-context.ts")>()),
  assertTaskLock: mocks.assertTaskLock,
}));
vi.mock("../src/utils/config.ts", async (original) => ({
  ...(await original<typeof import("../src/utils/config.ts")>()),
  getConfig: () => mocks.config,
}));
vi.mock("node:fs", () => ({
  default: {
    readFileSync: mocks.readFileSync,
    writeFileSync: mocks.writeFileSync,
    rmSync: mocks.rmSync,
  },
}));
import * as api from "../src/+.ts";
import * as tasks from "../src/tasks/_.ts";
import * as methods from "../src/utils/windows-manager/methods/index.ts";

function windowAt(id: number, x: number, y: number): Window {
  return {
    id,
    pid: id + 100,
    app: `app-${id}`,
    frame: { x, y, w: 500, h: 400 },
    display: 1,
    space: 1,
    "has-focus": id === 2,
    "is-visible": true,
    "split-type": "horizontal",
  } as Window;
}
function manager() {
  const wm = new api.WindowsManager({
    runtime,
    display: { index: 1, frame: { x: 0, y: 0, w: 1000, h: 800 } } as Display,
    space: { id: 1, index: 1 } as Space,
    expectedCurrentNumMasterWindows: 2,
  });
  wm.windowsData = [
    windowAt(1, 0, 0),
    windowAt(2, 500, 0),
    windowAt(3, 0, 400),
    windowAt(4, 500, 400),
  ];
  return wm;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.masterPosition = "right";
  mocks.assertTaskLock.mockReset();
  mocks.readFileSync.mockReturnValue(process.pid.toString());
  mocks.spawn.mockImplementation(() => ({
    stdout: new Response("[]").body,
    exited: Promise.resolve(0),
  }));
  vi.stubGlobal("Bun", { spawn: mocks.spawn });
});
afterEach(() => vi.unstubAllGlobals());

test("the API exposes every task and manager method without invoking them", () => {
  expect(Object.keys(api.tasksMap)).toHaveLength(28);
  for (const [name, task] of Object.entries(tasks)) {
    expect(api[name as keyof typeof api]).toBe(task);
    expect(Object.values(api.tasksMap)).toContain(task);
  }
  for (const [name, method] of Object.entries(methods)) {
    expect(
      api[name === "moveWindowToMaster" ? "moveManagedWindowToMaster" : (name as keyof typeof api)],
    ).toBe(method);
  }
  expect(api.windowsManagerMethods).toEqual(methods);
  expect(mocks.spawn).not.toHaveBeenCalled();
  expect(mocks.writeFileSync).not.toHaveBeenCalled();
});

test.each(["left", "right"] as const)(
  "classifies and validates a %s master layout",
  async (position) => {
    mocks.config.masterPosition = position;
    const wm = manager();
    expect(wm.getMasterWindows().map((w) => w.id)).toEqual(position === "right" ? [2, 4] : [1, 3]);
    expect(wm.getStackWindows().map((w) => w.id)).toEqual(position === "right" ? [1, 3] : [2, 4]);
    expect(wm.getMiddleWindows()).toEqual([]);
    expect(await wm.isValidLayout()).toEqual({ status: true });
    expect(wm.getFocusedWindow()?.id).toBe(2);
    expect(wm.getTopWindow(wm.windowsData)?.id).toBe(1);
    expect(wm.getBottomWindow(wm.windowsData)?.id).toBe(3);
    expect(wm.getWindowData({ processId: "102" }).id).toBe(2);
  },
);

test("filters windows by display, space, visibility, and floating state", async () => {
  const wm = manager();
  const valid = windowAt(1, 0, 0);
  const output = [
    valid,
    { ...valid, id: 2, display: 2 },
    { ...valid, id: 3, space: 2 },
    { ...valid, id: 4, "is-floating": true },
    { ...valid, id: 5, "is-minimized": true },
    { ...valid, id: 6, "is-hidden": true },
    { ...valid, id: 7, "is-visible": false },
  ];
  mocks.spawn.mockReturnValue({ stdout: new Response(JSON.stringify(output)).body });
  expect(await wm.getWindowsData()).toEqual([valid]);
  expect(mocks.spawn).toHaveBeenCalledWith(["/custom/yabai", "-m", "query", "--windows"], {
    stdout: "pipe",
    stderr: "pipe",
    env: {},
  });
});

test("refuses commands without active task ownership", async () => {
  mocks.assertTaskLock.mockImplementation(() => {
    throw Object.assign(new Error("lock lost"), { code: "ELOCKED" });
  });
  await expect(manager().executeYabaiCommand("-m window --focus east")).rejects.toMatchObject({
    code: "ELOCKED",
  });
  expect(mocks.spawn).not.toHaveBeenCalled();
});

test("focusDisplay waits for subprocess completion", async () => {
  let finish!: (code: number) => void;
  mocks.spawn.mockReturnValue({
    exited: new Promise<number>((resolve) => {
      finish = resolve;
    }),
  });
  let completed = false;
  const pending = api.focusDisplay(runtime, 1 as api.DisplayIndex).then(() => {
    completed = true;
  });
  await Promise.resolve();
  expect(completed).toBe(false);
  finish(0);
  await pending;
  expect(completed).toBe(true);
});

test("authoritative focused query works when has-focus is false", () => {
  const wm = manager();
  wm.focusQueryCompleted = true;
  wm.focusedWindowData = { ...windowAt(9, 0, 0), "has-focus": false };
  expect(wm.getFocusedWindow()?.id).toBe(9);
  wm.focusedWindowData = undefined;
  expect(wm.getFocusedWindow()).toBeUndefined();
});

test("excludes dialogs/fullscreen while retaining ordinary windows on inactive spaces", async () => {
  const wm = manager();
  wm.space["is-visible"] = false;
  const valid = { ...windowAt(1, 0, 0), "is-visible": false };
  mocks.spawn.mockReturnValue({
    stdout: new Response(
      JSON.stringify([
        valid,
        { ...valid, id: 2, subrole: "AXDialog" },
        { ...valid, id: 3, "is-native-fullscreen": true },
      ]),
    ).body,
  });
  expect(await wm.getWindowsData()).toEqual([valid]);
});
