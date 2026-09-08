import { beforeEach, expect, test, vi } from "vite-plus/test";
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
  rename: vi.fn(),
  spaces: vi.fn(),
  config: { windowManager: "yabai" },
}));
vi.mock("../src/utils/config.ts", () => ({ getConfig: () => mocks.config }));
vi.mock("node:fs", () => ({
  default: {
    existsSync: () => true,
    readFileSync: mocks.read,
    writeFileSync: mocks.write,
    renameSync: mocks.rename,
    mkdirSync: vi.fn(),
  },
}));
vi.mock("../src/utils/space.ts", () => ({ getSpaces: mocks.spaces }));
import { readState, writeState } from "../src/utils/state.ts";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.windowManager = "yabai";
});
test("state cleanup uses IDs, preserving known counts and adding new spaces", async () => {
  mocks.read.mockReturnValue(
    JSON.stringify({ 99: { numMasterWindows: 5 }, 555: { numMasterWindows: 2 } }),
  );
  mocks.spaces.mockResolvedValue([
    { id: 99, index: 1 },
    { id: 100, index: 2 },
  ]);
  expect(await readState()).toEqual({ 99: { numMasterWindows: 5 }, 100: { numMasterWindows: 1 } });
});
test("state is written to a temporary file then atomically renamed", () => {
  writeState({ 99: { numMasterWindows: 3 } });
  expect(mocks.write.mock.calls[0][0]).toMatch(/state.json.tmp$/);
  expect(mocks.rename.mock.calls[0][1]).toMatch(/state.json$/);
});
test("AeroSpace keeps transient workspace settings in a separate file", async () => {
  mocks.config.windowManager = "aerospace";
  mocks.read.mockReturnValue(
    JSON.stringify({ Work: { numMasterWindows: 3 }, Absent: { numMasterWindows: 5 } }),
  );
  mocks.spaces.mockResolvedValue([{ id: "Work" }, { id: "1" }, { id: "01" }]);
  const state = await readState();
  expect(state).toEqual({
    Work: { numMasterWindows: 3 },
    Absent: { numMasterWindows: 5 },
    1: { numMasterWindows: 1 },
    "01": { numMasterWindows: 1 },
  });
  writeState(state);
  expect(mocks.read.mock.calls[0][0]).toMatch(/state.aerospace.json$/);
  expect(mocks.rename.mock.calls[0][1]).toMatch(/state.aerospace.json$/);
});
test("workspace names cannot collide with inherited object properties", async () => {
  mocks.config.windowManager = "aerospace";
  mocks.read.mockReturnValue("{}");
  mocks.spaces.mockResolvedValue([{ id: "__proto__" }, { id: "constructor" }]);
  const state = await readState();
  expect(Object.hasOwn(state, "__proto__")).toBe(true);
  expect(state.__proto__).toEqual({ numMasterWindows: 1 });
  expect(state.constructor).toEqual({ numMasterWindows: 1 });
});
