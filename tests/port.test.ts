import { YMSPRuntime } from "../src/utils/runtime.ts";
let runtime = new YMSPRuntime();
import { beforeEach, expect, test, vi } from "vite-plus/test";
import type { Display, Space, Window } from "../src/types/_.ts";

const mocks = vi.hoisted(() => ({
  config: {
    masterPosition: "right" as "left" | "right",
    resizeIncrement: 50,
    moveNewWindowsToMaster: false,
  },
  initialize: vi.fn(),
  writeState: vi.fn(),
  queryWindows: vi.fn(),
  queryFocusedWindow: vi.fn(),
  getDisplays: vi.fn(),
  getFocusedDisplay: vi.fn(),
  runYabai: vi.fn(),
  getSpaces: vi.fn(),
}));
vi.mock("../src/utils/config.ts", async (original) => ({
  ...(await original<typeof import("../src/utils/config.ts")>()),
  getConfig: () => mocks.config,
}));
vi.mock("../src/utils/task.ts", () => ({ defineTask: (fn: unknown) => fn }));
vi.mock("../src/utils/windows-manager.ts", () => ({
  createInitializedWindowsManager: mocks.initialize,
}));
vi.mock("../src/utils/state.ts", () => ({ writeState: mocks.writeState }));
vi.mock("../src/utils/yabai.ts", () => ({
  queryWindows: mocks.queryWindows,
  queryFocusedWindow: mocks.queryFocusedWindow,
  runYabai: mocks.runYabai,
}));
vi.mock("../src/utils/space.ts", () => ({ getSpaces: mocks.getSpaces }));
vi.mock("../src/utils/display.ts", () => ({
  getDisplays: mocks.getDisplays,
  getFocusedDisplay: mocks.getFocusedDisplay,
}));
import { WindowsManager } from "../src/utils/windows-manager/class.ts";
import * as tasks from "../src/tasks/_.ts";

function win(id: number, x: number, y: number): Window {
  return {
    id,
    pid: 100,
    app: String(id),
    display: 1,
    space: 1,
    frame: { x, y, w: 500, h: 400 },
    "is-visible": true,
    "split-type": "horizontal",
    "is-floating": false,
  } as Window;
}
let wm: WindowsManager;
let commands: string[];
let state: Record<string, { numMasterWindows: number }>;
beforeEach(() => {
  runtime = new YMSPRuntime();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mocks.config.masterPosition = "right";
  mocks.config.moveNewWindowsToMaster = false;
  wm = new WindowsManager({
    runtime,
    display: { index: 1, frame: { x: -1100, y: 0, w: 1100, h: 800 } } as Display,
    space: { id: 99, index: 1, type: "bsp", "is-visible": 1 } as Space,
    expectedCurrentNumMasterWindows: 2,
  });
  wm.windowsData = [win(1, -1080, 20), win(2, -560, 20), win(3, -1080, 420), win(4, -560, 420)];
  state = { 99: { numMasterWindows: 2 } };
  commands = [];
  wm.executeYabaiCommand = vi.fn(async (command) => {
    commands.push(command);
    return "";
  });
  mocks.initialize.mockResolvedValue({ wm, state, space: wm.space, display: wm.display });
  mocks.queryWindows.mockImplementation(async () => wm.windowsData);
  mocks.getSpaces.mockResolvedValue([wm.space]);
});
function focus(id: number) {
  for (const w of wm.windowsData) w["has-focus"] = w.id === id;
}

test.each(["left", "right"] as const)(
  "classification handles padding and negative monitor coordinates (%s)",
  async (position) => {
    mocks.config.masterPosition = position;
    expect(wm.getMasterWindows().map((w) => w.id)).toEqual(position === "right" ? [2, 4] : [1, 3]);
    expect(await wm.isValidLayout()).toEqual({ status: true });
    expect(wm.doesStackExist()).toBe(true);
    wm.windowsData = [win(1, -1080, 20), win(2, -1080, 420)];
    wm.expectedCurrentNumMasterWindows = 5;
    expect(await wm.isValidLayout()).toEqual({ status: true });
    expect(wm.getStackWindows()).toEqual([]);
    expect(wm.doesStackExist()).toBe(false);
  },
);

test("rejects nested third columns even when the master count matches", async () => {
  wm.windowsData.push(win(5, -800, 420));
  expect((await wm.isValidLayout()).status).toBe(false);
});

test.each(["left", "right"] as const)(
  "rebuilds with the chosen master and ordered columns (%s)",
  async (position) => {
    mocks.config.masterPosition = position;
    wm.setWindowFloating = vi.fn(async (id, floating) => {
      commands.push(`${id}:${floating}`);
    });
    await wm.relayoutWindows(wm.windowsData[1]);
    expect(commands).toEqual([
      "1:true",
      "3:true",
      "4:true",
      `-m window 2 --insert ${position === "right" ? "west" : "east"}`,
      "3:false",
      "-m window 2 --insert south",
      "1:false",
      "-m window 3 --insert south",
      "4:false",
    ]);
  },
);

test("rebuilds a single column when configured masters exceed available windows", async () => {
  wm.expectedCurrentNumMasterWindows = 9;
  wm.setWindowFloating = vi.fn(async () => {});
  await wm.relayoutWindows(wm.windowsData[1]);
  expect(commands).toEqual([
    "-m window 2 --insert south",
    "-m window 1 --insert south",
    "-m window 3 --insert south",
  ]);
});

test("restores temporarily floating windows after a failed rebuild", async () => {
  const floating = new Set<number>();
  wm.setWindowFloating = vi.fn(async (id, value) => {
    if (value) floating.add(id);
    else floating.delete(id);
  });
  wm.executeYabaiCommand = vi.fn(async () => {
    throw new Error("insert failed");
  });
  await expect(wm.relayoutWindows()).rejects.toThrow("insert failed");
  expect(floating.size).toBe(0);
});

test("does not rebuild float/native fullscreen spaces", async () => {
  wm.space.type = "float";
  await wm.relayoutWindows();
  expect(commands).toEqual([]);
});

test.each([
  ["focusDownWindow", 4, 1],
  ["focusDownWindow", 3, 2],
  ["focusUpWindow", 2, 3],
  ["focusUpWindow", 1, 4],
  ["moveWindowDown", 4, 1],
  ["moveWindowDown", 3, 2],
  ["moveWindowUp", 2, 3],
  ["moveWindowUp", 1, 4],
] as const)("%s wraps from %i to %i", async (name, from, to) => {
  focus(from);
  await tasks[name](runtime);
  expect(commands).toEqual([
    name.startsWith("move") ? `-m window ${from} --swap ${to}` : `-m window --focus ${to}`,
  ]);
});

test("focus fallback uses top/bottom master and empty layouts are no-ops", async () => {
  await tasks.focusDownWindow(runtime);
  await tasks.focusUpWindow(runtime);
  expect(commands).toEqual(["-m window --focus 2", "-m window --focus 4"]);
  commands.length = 0;
  wm.windowsData = [];
  await tasks.focusDownWindow(runtime);
  await tasks.focusUpWindow(runtime);
  await tasks.moveWindowUp(runtime);
  await tasks.relayout(runtime);
  expect(commands).toEqual([]);
});

test("focus and promotion select the top master by ID", async () => {
  focus(3);
  await tasks.focusMasterWindow(runtime);
  await tasks.moveWindowToMaster(runtime);
  expect(commands).toEqual(["-m window --focus 2", "-m window 3 --swap 2"]);
});

test.each([
  ["right", 2, "left", -50],
  ["right", 1, "right", -50],
  ["left", 1, "right", 50],
  ["left", 2, "left", 50],
] as const)("master width grows toward stack (%s, focus %i)", async (position, id, edge, delta) => {
  mocks.config.masterPosition = position;
  focus(id);
  await tasks.increaseMasterWidth(runtime);
  await tasks.decreaseMasterWidth(runtime);
  expect(commands).toEqual([
    `-m window ${id} --resize ${edge}:${delta}:0`,
    `-m window ${id} --resize ${edge}:${-delta}:0`,
  ]);
});

test.each([
  [2, "bottom", 50],
  [4, "top", -50],
  [1, "bottom", 50],
  [3, "top", -50],
] as const)("height resize chooses the inner edge (%i)", async (id, edge, delta) => {
  focus(id);
  await tasks.increaseWindowHeight(runtime);
  await tasks.decreaseWindowHeight(runtime);
  expect(commands).toEqual([
    `-m window ${id} --resize ${edge}:0:${delta}`,
    `-m window ${id} --resize ${edge}:0:${-delta}`,
  ]);
});

test("master count persists above window count and never goes below one", async () => {
  wm.windowsData = [];
  wm.relayoutWindows = vi.fn();
  await tasks.increaseMasterWindowCount(runtime);
  expect(state[99].numMasterWindows).toBe(3);
  await tasks.decreaseMasterWindowCount(runtime);
  await tasks.decreaseMasterWindowCount(runtime);
  await tasks.decreaseMasterWindowCount(runtime);
  expect(state[99].numMasterWindows).toBe(1);
  wm.validateState(state);
  expect(state[99].numMasterWindows).toBe(1);
});

test("restores floating focus into the top of the stack", async () => {
  wm.allWindowsData = [{ ...win(9, 0, 0), "has-focus": true, "is-floating": true }];
  wm.updateWindows = vi.fn();
  await tasks.toggleFloatFocusedWindow(runtime);
  expect(commands).toEqual(["-m window 1 --insert north", "-m window 9 --toggle float"]);
});

test("close promotes the only master before closing the original ID", async () => {
  wm.windowsData = [win(1, -1080, 20), win(2, -560, 20), win(3, -1080, 420)];
  focus(2);
  wm.updateWindows = vi.fn();
  await tasks.closeFocusedWindow(runtime);
  expect(commands).toEqual(["-m window 2 --swap 1", "-m window 2 --close", "-m window --focus 1"]);
});

test("close stack focuses the next window, minimize focuses the previous", async () => {
  wm.windowsData.push(win(5, -1080, 600));
  focus(3);
  wm.updateWindows = vi.fn();
  await tasks.closeFocusedWindow(runtime);
  expect(commands).toEqual(["-m window 3 --close", "-m window --focus 5"]);
  commands.length = 0;
  await tasks.minimizeFocusedWindow(runtime);
  expect(commands).toEqual(["-m window 3 --minimize", "-m window --focus 1"]);
});

test("event ID takes precedence over process ID and selects its own space", async () => {
  runtime = new YMSPRuntime({ environment: { YABAI_WINDOW_ID: "4", YABAI_PROCESS_ID: "100" } });
  wm.windowsData[3].space = 7;
  wm.updateWindows = vi.fn();
  await tasks.windowCreated(runtime);
  expect(mocks.initialize).toHaveBeenCalledExactlyOnceWith(runtime, 7);
  expect(commands).toEqual(["-m config split_type horizontal"]);
});

test("stale and non-tiled creation events do nothing", async () => {
  await tasks.windowCreated(runtime, 999);
  expect(commands).toEqual([]);
  mocks.queryWindows.mockResolvedValue([win(99, 0, 0)]);
  await tasks.windowCreated(runtime, 99);
  expect(commands).toEqual([]);
});

test("new-window master preference applies even if layout is already valid", async () => {
  mocks.config.moveNewWindowsToMaster = true;
  wm.relayoutWindows = vi.fn();
  await tasks.windowCreated(runtime, 3);
  expect(wm.relayoutWindows).toHaveBeenCalledWith(wm.windowsData[2]);
});

test("creation at master capacity sets the next split vertical", async () => {
  wm.windowsData = wm.windowsData.slice(0, 2);
  wm.updateWindows = vi.fn();
  await tasks.windowCreated(runtime, 2);
  expect(commands[0]).toBe("-m config split_type vertical");
});

test("destroyed event repairs every visible BSP space", async () => {
  mocks.getSpaces.mockResolvedValue([
    wm.space,
    { ...wm.space, index: 2 },
    { ...wm.space, index: 3, type: "float" },
    { ...wm.space, index: 4, "is-visible": 0 },
  ]);
  wm.updateWindows = vi.fn();
  await tasks.windowDestroyed(runtime);
  expect(mocks.initialize.mock.calls).toEqual([
    [runtime, 1],
    [runtime, 2],
  ]);
});

test("space commands reject invalid indices before invoking yabai", async () => {
  for (const index of [0, -1, 1.5, NaN]) {
    await expect(tasks.focusSpace(runtime, index)).rejects.toThrow("positive integer");
    await expect(tasks.moveWindowToSpace(runtime, index)).rejects.toThrow("positive integer");
  }
  expect(mocks.runYabai).not.toHaveBeenCalled();
});

test("focus-space focuses its top master after switching", async () => {
  wm.refreshWindowsData = vi.fn();
  await tasks.focusSpace(runtime, 7);
  expect(mocks.initialize).toHaveBeenCalledWith(runtime, 7);
  expect(mocks.runYabai).toHaveBeenCalledWith(runtime, "space", "--focus", "7");
  expect(commands).toEqual(["-m window --focus 2"]);
});

test("space moves insert into the destination and repair the source", async () => {
  mocks.queryFocusedWindow.mockResolvedValue(wm.windowsData[2]);
  wm.refreshWindowsData = vi.fn();
  wm.moveWindowToStack = vi.fn();
  wm.updateWindows = vi.fn();
  await tasks.moveWindowToSpace(runtime, 7);
  expect(mocks.runYabai).toHaveBeenCalledWith(runtime, "window", "3", "--space", "7");
  expect(mocks.initialize.mock.calls).toEqual([
    [runtime, 7],
    [runtime, 1],
  ]);
  expect(wm.moveWindowToStack).toHaveBeenCalledWith(wm.windowsData[2]);
  expect(wm.updateWindows).toHaveBeenCalledTimes(2);
});

test("display cycling follows coordinates, wraps, and handles an empty list", async () => {
  mocks.getDisplays.mockResolvedValue([
    { id: 20, index: 2, frame: { x: 1000, y: 0 } },
    { id: 10, index: 1, frame: { x: -1000, y: 0 } },
  ]);
  mocks.getFocusedDisplay.mockResolvedValue({ id: 20 });
  await tasks.focusNextDisplay(runtime);
  expect(mocks.runYabai).toHaveBeenCalledWith(runtime, "display", "--focus", "1");
  mocks.getDisplays.mockResolvedValue([]);
  mocks.runYabai.mockClear();
  await tasks.focusPreviousDisplay(runtime);
  expect(mocks.runYabai).not.toHaveBeenCalled();
});
