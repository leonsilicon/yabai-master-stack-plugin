import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { Display, Space, Window } from "../src/types/_.ts";
const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  query: vi.fn(),
  lock: vi.fn(),
  config: { masterPosition: "right" as "left" | "right" },
}));
vi.mock("../src/utils/config.ts", () => ({ getConfig: () => mocks.config }));
vi.mock("../src/utils/aerospace.ts", () => ({
  runAerospace: mocks.run,
  queryAerospaceWindows: mocks.query,
}));
vi.mock("../src/utils/task-context.ts", () => ({ assertTaskLock: mocks.lock }));
import { executeAerospaceCommand, rebuildAerospace } from "../src/utils/aerospace-layout.ts";
import { WindowsManager } from "../src/utils/windows-manager/class.ts";
let wm: WindowsManager;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.masterPosition = "right";
  mocks.run.mockResolvedValue("");
  wm = new WindowsManager({
    display: { index: 1 } as Display,
    space: { index: "Work" } as Space,
    expectedCurrentNumMasterWindows: 2,
  });
  wm.windowsData = Array.from(
    { length: 6 },
    (_, i) =>
      ({
        id: i + 1,
        space: "Work",
        frame: { x: i < 3 ? 0 : 500, y: (i % 3) * 300, w: 500, h: 300 },
      }) as Window,
  );
  wm.allWindowsData = wm.windowsData;
  wm.refreshWindowsData = vi.fn();
  mocks.query.mockResolvedValue([wm.windowsData[4]]);
});
describe("native layout operations", () => {
  test.each(Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6) + 1, (i % 6) + 1]))(
    "swap %i with %i preserves every other slot",
    async (a, b) => {
      const order = wm.windowsData.map((w) => w.id);
      mocks.run.mockImplementation((cmd: string, _flag: string, id: string, direction: string) => {
        expect(cmd).toBe("swap");
        const index = order.indexOf(Number(id));
        const target = index + (direction === "dfs-next" ? 1 : -1);
        expect(target).toBeGreaterThanOrEqual(0);
        expect(target).toBeLessThan(order.length);
        [order[index], order[target]] = [order[target], order[index]];
        return Promise.resolve("");
      });
      await executeAerospaceCommand(wm, ["-m", "window", String(a), "--swap", String(b)]);
      const expected = [1, 2, 3, 4, 5, 6];
      [expected[a - 1], expected[b - 1]] = [expected[b - 1], expected[a - 1]];
      expect(order).toEqual(expected);
    },
  );
  test("requires active ownership before mutating the tree", async () => {
    mocks.lock.mockImplementation(() => {
      throw new Error("lost lock");
    });
    await expect(
      rebuildAerospace(wm, [wm.windowsData[0]], wm.windowsData.slice(1)),
    ).rejects.toThrow("lost lock");
    expect(mocks.run).not.toHaveBeenCalled();
  });
  test("restores original focus on rebuild failure without floating any windows", async () => {
    mocks.run.mockImplementation((command: string) =>
      command === "join-with" ? Promise.reject(new Error("join failed")) : Promise.resolve(""),
    );
    await expect(
      rebuildAerospace(wm, wm.windowsData.slice(3), wm.windowsData.slice(0, 3)),
    ).rejects.toThrow("join failed");
    expect(mocks.run).toHaveBeenLastCalledWith("focus", "--window-id", "5");
    expect(mocks.run.mock.calls.some((args) => args.includes("floating"))).toBe(false);
  });
  test.each(["left:-50:0", "right:50:0"])(
    "%s grows the selected column by 50 pixels",
    async (edge) => {
      await executeAerospaceCommand(wm, ["-m", "window", "4", "--resize", edge]);
      expect(mocks.run).toHaveBeenCalledWith("resize", "--window-id", "4", "width", "+50");
    },
  );
  test("non-top height resize borrows from the previous window only", async () => {
    await executeAerospaceCommand(wm, ["-m", "window", "3", "--resize", "top:0:-60"]);
    expect(mocks.run.mock.calls).toEqual([
      ["resize", "--window-id", "3", "height", "+40"],
      ["resize", "--window-id", "2", "height", "-40"],
    ]);
  });
  test("rejects unknown commands and non-tiled swaps", async () => {
    await expect(
      executeAerospaceCommand(wm, ["-m", "window", "99", "--swap", "1"]),
    ).rejects.toThrow("non-tiled");
    await expect(
      executeAerospaceCommand(wm, ["-m", "window", "1", "--grid", "foo"]),
    ).rejects.toThrow("Unsupported");
  });
});
