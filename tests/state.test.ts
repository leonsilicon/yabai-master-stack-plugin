import { beforeEach, expect, test, vi } from "vite-plus/test";
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
  rename: vi.fn(),
  spaces: vi.fn(),
}));
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
beforeEach(() => vi.clearAllMocks());
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
