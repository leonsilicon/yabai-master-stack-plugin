import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vite-plus/test";
import { execFile, spawn, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import type { Window } from "../src/types/_.ts";

const exec = promisify(execFile);
const enabled = process.env.YMSP_AEROSPACE_LIVE === "1";
const aerospace = process.env.YMSP_AEROSPACE_PATH ?? "/opt/homebrew/bin/aerospace";
const root = path.resolve(import.meta.dirname, "..");
const workspace = "YMSP-Vitest";
const destination = "YMSP-Vitest-Other";
let directory: string;
let fixtureExecutable: string;
let fixture: ChildProcess | undefined;
let watcher: ChildProcess | undefined;
let originalWorkspace: string;
let originalFocus: number | undefined;
let config: {
  windowManager: string;
  aerospacePath: string;
  masterPosition: string;
  moveNewWindowsToMaster: boolean;
};
const aero = async (...args: string[]) => (await exec(aerospace, args)).stdout;
const env = () => ({ ...process.env, YMSP_CONFIG_DIR: directory });
const ymsp = async (task: string, ...args: string[]) =>
  exec("bun", [path.join(root, "src/_ymsp.ts"), task, ...args], { env: env() });
const focus = (id: number) => aero("focus", "--window-id", String(id));
const writeConfig = () =>
  fs.writeFileSync(path.join(directory, "ymsp.config.json"), JSON.stringify(config));
// Queries run in Bun too: exercise the same runtime and code used by consumers.
const windows = async (): Promise<Window[]> =>
  JSON.parse(
    (
      await exec(
        "bun",
        [
          "-e",
          `const {queryAerospaceWindows}=await import(${JSON.stringify(path.join(root, "src/utils/aerospace.ts"))});console.log(JSON.stringify(await queryAerospaceWindows()));`,
        ],
        { env: env() },
      )
    ).stdout,
  ) as Window[];
const testWindows = async () => (await windows()).filter((w) => w.pid === fixture?.pid);
const focused = async () => {
  try {
    return (
      JSON.parse(await aero("list-windows", "--focused", "--json")) as { "window-id": number }[]
    )[0]?.["window-id"];
  } catch {
    return undefined;
  }
};
async function waitFor(check: () => Promise<boolean>, label = "native window state") {
  await expect.poll(check, { timeout: 10000, interval: 100, message: label }).toBe(true);
}
async function stop(child: ChildProcess | undefined) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  child.kill("SIGTERM");
  await exited;
}
async function columns() {
  const tiled = (await testWindows()).filter(
    (w) =>
      w.space === workspace && !w["is-floating"] && !w["is-hidden"] && !w["is-native-fullscreen"],
  );
  const xs = [...new Set(tiled.map((w) => w.frame.x))].sort((a, b) => a - b);
  expect(xs.length).toBeLessThanOrEqual(2);
  const masterX = config.masterPosition === "left" ? xs[0] : xs.at(-1);
  const masters = tiled.filter((w) => w.frame.x === masterX).sort((a, b) => a.frame.y - b.frame.y);
  const stacks = tiled.filter((w) => w.frame.x !== masterX).sort((a, b) => a.frame.y - b.frame.y);
  for (const column of [masters, stacks]) {
    for (const w of column) expect(Math.abs(w.frame.w - column[0].frame.w)).toBeLessThanOrEqual(1);
    for (let i = 1; i < column.length; i++)
      expect(column[i].frame.y).toBeGreaterThanOrEqual(
        column[i - 1].frame.y + column[i - 1].frame.h - 1,
      );
  }
  return { masters, stacks, ordered: [...masters, ...stacks] };
}

// Deliberately opt-in: this suite moves real macOS windows. It requires an
// isolated server configuration, not the user's ordinary callback/hotkey setup.
describe.skipIf(!enabled)("AeroSpace 0.21.3 native integration", () => {
  beforeAll(async () => {
    expect(process.platform).toBe("darwin");
    const isolatedConfig = process.env.YMSP_AEROSPACE_LIVE_CONFIG;
    if (!isolatedConfig)
      throw new Error("Set YMSP_AEROSPACE_LIVE_CONFIG to the isolated server config path");
    expect((await aero("config", "--config-path")).trim()).toBe(isolatedConfig);
    const version = await aero("--version");
    expect(version).toContain("CLI client version: 0.21.3-Beta");
    expect(version).toContain("server version: 0.21.3-Beta");
    console.log(version.trim());
    originalWorkspace = (await aero("list-workspaces", "--focused")).trim();
    originalFocus = await focused();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "ymsp-vitest-"));
    const contents = path.join(directory, "YMSPVitestWindows.app", "Contents");
    fs.mkdirSync(path.join(contents, "MacOS"), { recursive: true });
    fs.writeFileSync(
      path.join(contents, "Info.plist"),
      `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>dev.ymsp.vitest-windows</string>
<key>CFBundleExecutable</key><string>YMSPVitestWindows</string>
<key>CFBundleName</key><string>YMSP Vitest Windows</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>NSPrincipalClass</key><string>NSApplication</string>
</dict></plist>`,
    );
    fixtureExecutable = path.join(contents, "MacOS", "YMSPVitestWindows");
    await exec("swiftc", [
      path.join(root, "tests/fixtures/aerospace-windows.swift"),
      "-o",
      fixtureExecutable,
    ]);
  }, 30000);
  afterAll(async () => {
    await stop(watcher);
    await stop(fixture);
    if (originalWorkspace) await aero("workspace", "--", originalWorkspace);
    if (originalFocus) await focus(originalFocus).catch(() => {});
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  describe.each(["left", "right"])("%s master", (position) => {
    beforeEach(async () => {
      await stop(watcher);
      watcher = undefined;
      await stop(fixture);
      config = {
        windowManager: "aerospace",
        aerospacePath: aerospace,
        masterPosition: position,
        moveNewWindowsToMaster: false,
      };
      writeConfig();
      fs.writeFileSync(
        path.join(directory, "state.aerospace.json"),
        JSON.stringify({ [workspace]: { numMasterWindows: 1 } }),
      );
      await aero("workspace", "--", workspace);
      fixture = spawn(fixtureExecutable, [], {
        stdio: ["pipe", "ignore", "inherit"],
      });
      await waitFor(async () => (await testWindows()).length === 6);
      for (const w of await testWindows()) {
        await aero("move-node-to-workspace", "--window-id", String(w.id), "--", workspace);
        await aero("layout", "--window-id", String(w.id), "tiling");
      }
      await ymsp("relayout");
    }, 30000);

    test("builds both columns, reserves capacity beyond window count, and restores one master", async () => {
      expect((await columns()).masters).toHaveLength(1);
      for (let count = 2; count <= 7; count++) {
        await ymsp("increase-master-window-count");
        expect((await columns()).masters).toHaveLength(Math.min(count, 6));
      }
      for (let count = 6; count >= 1; count--) {
        await ymsp("decrease-master-window-count");
        expect((await columns()).masters).toHaveLength(count);
      }
    }, 60000);
    test("focus traversal wraps through masters then stack in both directions", async () => {
      const { ordered } = await columns();
      await ymsp("focus-master-window");
      expect(await focused()).toBe(ordered[0].id);
      for (let i = 1; i <= ordered.length; i++) {
        await ymsp("focus-down-window");
        expect(await focused()).toBe(ordered[i % ordered.length].id);
      }
      await ymsp("focus-up-window");
      expect(await focused()).toBe(ordered.at(-1)!.id);
    }, 30000);
    test("swaps arbitrary IDs across the wrap boundary without changing unrelated positions", async () => {
      const before = await columns();
      const first = before.ordered[0],
        last = before.ordered.at(-1)!;
      await focus(last.id);
      await ymsp("move-window-down");
      const after = await columns();
      expect(after.ordered.map((w) => w.id)).toEqual([
        last.id,
        ...before.ordered.slice(1, -1).map((w) => w.id),
        first.id,
      ]);
      expect(await focused()).toBe(last.id);
      await ymsp("move-window-up");
      expect((await columns()).ordered.map((w) => w.id)).toEqual(before.ordered.map((w) => w.id));
      await ymsp("move-window-to-master");
      expect((await columns()).masters[0].id).toBe(last.id);
    }, 30000);
    test("width grows the master from either column and height affects only the adjacent window", async () => {
      let before = await columns();
      await focus(before.stacks[0].id);
      await ymsp("increase-master-width");
      let after = await columns();
      expect(after.masters[0].frame.w - before.masters[0].frame.w).toBeCloseTo(50, 0);
      await ymsp("decrease-master-width");
      before = await columns();
      await focus(before.masters[0].id);
      await ymsp("increase-master-width");
      after = await columns();
      expect(after.masters[0].frame.w - before.masters[0].frame.w).toBeCloseTo(50, 0);
      await ymsp("decrease-master-width");
      before = await columns();
      await focus(before.stacks[2].id);
      await ymsp("increase-window-height");
      after = await columns();
      expect(Math.abs(after.stacks[2].frame.h - before.stacks[2].frame.h - 50)).toBeLessThanOrEqual(
        1,
      );
      expect(Math.abs(after.stacks[1].frame.h - before.stacks[1].frame.h + 50)).toBeLessThanOrEqual(
        1,
      );
      for (const i of [0, 3, 4])
        expect(Math.abs(after.stacks[i].frame.h - before.stacks[i].frame.h)).toBeLessThanOrEqual(1);
      await ymsp("decrease-window-height");
    }, 30000);
    test("returns a floating window to the top of the stack and preserves the master", async () => {
      const before = await columns();
      const id = before.stacks[2].id;
      await focus(id);
      await ymsp("toggle-float-focused-window");
      expect((await testWindows()).find((w) => w.id === id)?.["is-floating"]).toBe(true);
      await ymsp("toggle-float-focused-window");
      const after = await columns();
      expect(after.masters[0].id).toBe(before.masters[0].id);
      expect(after.stacks[0].id).toBe(id);
    }, 30000);
    test("moves to named workspaces, repairs both sides, and leaves source focused", async () => {
      const id = (await columns()).stacks[1].id;
      await focus(id);
      await ymsp("move-window-to-space", destination);
      expect((await aero("list-workspaces", "--focused")).trim()).toBe(workspace);
      expect((await columns()).ordered).toHaveLength(5);
      await ymsp("focus-space", destination);
      expect(await focused()).toBe(id);
      await ymsp("move-window-to-space", workspace);
      expect((await aero("list-workspaces", "--focused")).trim()).toBe(destination);
      await ymsp("focus-space", workspace);
      expect((await columns()).stacks[0].id).toBe(id);
    }, 30000);
    test("minimizes and closes by ID while preserving occupancy and adjacent focus", async () => {
      let before = await columns();
      const minimized = before.stacks[2].id;
      await focus(minimized);
      await ymsp("minimize-focused-window");
      expect((await columns()).ordered).toHaveLength(5);
      expect(await focused()).toBe(before.stacks[1].id);
      before = await columns();
      await focus(before.masters[0].id);
      await ymsp("close-focused-window");
      const after = await columns();
      expect(after.ordered).toHaveLength(4);
      expect(after.masters[0].id).toBe(before.stacks[0].id);
      expect(await focused()).toBe(after.masters[0].id);
    }, 30000);
    test("new-window promotion uses AEROSPACE_WINDOW_ID and does not retile unrelated floats", async () => {
      config.moveNewWindowsToMaster = true;
      writeConfig();
      const floating = (await columns()).stacks[0].id;
      await focus(floating);
      await ymsp("toggle-float-focused-window");
      const before = new Set((await testWindows()).map((w) => w.id));
      fixture!.stdin!.write("new\n");
      await waitFor(async () => (await testWindows()).some((w) => !before.has(w.id)));
      const created = (await testWindows()).find((w) => !before.has(w.id))!;
      await aero("layout", "--window-id", String(created.id), "tiling");
      await exec("bun", [path.join(root, "src/_ymsp.ts"), "window-created"], {
        env: {
          ...env(),
          AEROSPACE_WINDOW_ID: String(created.id),
          YABAI_WINDOW_ID: String(floating),
        },
      });
      expect((await columns()).masters[0].id).toBe(created.id);
      expect((await testWindows()).find((w) => w.id === floating)?.["is-floating"]).toBe(true);
    }, 30000);
    test("watcher repairs native close, restore, and app visibility, and shuts down cleanly", async () => {
      watcher = spawn("bun", [path.join(root, "src/_ymsp.ts"), "watch-aerospace"], {
        env: env(),
        stdio: ["ignore", "ignore", "inherit"],
      });
      await waitFor(async () => fs.existsSync(path.join(directory, "aerospace-watcher.lock")));
      // A second startup registration must not create a competing watcher.
      await ymsp("watch-aerospace");
      const master = (await columns()).masters[0].id;
      await aero("close", "--window-id", String(master));
      await waitFor(async () => {
        try {
          const c = await columns();
          return c.masters.length === 1 && c.ordered.length === 5;
        } catch {
          return false;
        }
      });
      const minimized = (await columns()).stacks[0].id;
      await aero("macos-native-minimize", "--window-id", String(minimized));
      await waitFor(async () => (await columns()).ordered.length === 4);
      fixture!.stdin!.write("restore\n");
      await waitFor(async () => {
        try {
          return (await columns()).ordered.length === 5;
        } catch {
          return false;
        }
      });
      fixture!.stdin!.write("hide\n");
      await waitFor(async () => (await columns()).ordered.length === 0, "app to hide");
      fixture!.stdin!.write("unhide\n");
      await aero("workspace", "--", workspace);
      await waitFor(async () => {
        try {
          const c = await columns();
          return c.ordered.length === 5 && c.masters.length === 1;
        } catch {
          return false;
        }
      }, "app to unhide and repair");
      const resized = (await columns()).masters[0];
      await focus(resized.id);
      await ymsp("increase-master-width");
      await setTimeout(1500);
      expect((await columns()).masters[0].frame.w - resized.frame.w).toBeCloseTo(50, 0);
      await stop(watcher);
      expect(watcher!.exitCode).toBe(0);
      expect(fs.existsSync(path.join(directory, "aerospace-watcher.lock"))).toBe(false);
    }, 30000);
    test("preserves master occupancy when closing one of multiple masters", async () => {
      await ymsp("increase-master-window-count");
      const before = await columns();
      await focus(before.masters[0].id);
      await ymsp("close-focused-window");
      const after = await columns();
      expect(after.ordered).toHaveLength(5);
      expect(after.masters.map((w) => w.id)).toEqual([
        before.masters[1].id,
        before.stacks.at(-1)!.id,
      ]);
    }, 30000);
    test("preserves AeroSpace fullscreen until it is exited", async () => {
      const id = (await columns()).masters[0].id;
      await aero("fullscreen", "--window-id", String(id), "on");
      const before = (await testWindows()).find((w) => w.id === id)!;
      expect(before["is-native-fullscreen"]).toBe(true);
      await ymsp("relayout");
      await ymsp("window-destroyed");
      expect((await testWindows()).find((w) => w.id === id)?.frame).toEqual(before.frame);
      await aero("fullscreen", "--window-id", String(id), "off");
      await ymsp("window-destroyed");
      expect((await columns()).ordered).toHaveLength(6);
    }, 30000);
    test("does not rebuild accordion workspaces", async () => {
      await aero("layout", "--workspace", workspace, "--root", "h_accordion");
      const before = (await testWindows()).map((w) => [w.id, w.frame]);
      await ymsp("relayout");
      await ymsp("window-destroyed");
      expect((await testWindows()).map((w) => [w.id, w.frame])).toEqual(before);
    }, 30000);
    test("empty workspace commands are harmless", async () => {
      await ymsp("focus-space", destination);
      for (const command of [
        "focus-master-window",
        "focus-up-window",
        "focus-down-window",
        "move-window-up",
        "move-window-down",
        "move-window-to-master",
        "increase-master-width",
        "decrease-master-width",
        "increase-window-height",
        "decrease-window-height",
        "close-focused-window",
        "minimize-focused-window",
        "toggle-float-focused-window",
        "relayout",
      ]) {
        await ymsp(command);
      }
      expect((await aero("list-windows", "--workspace", destination, "--count")).trim()).toBe("0");
      await ymsp("focus-space", workspace);
      expect((await columns()).ordered).toHaveLength(6);
    }, 30000);
    test("cycles displays and moves windows across physical monitors", async (context) => {
      const monitors = JSON.parse(await aero("list-monitors", "--json")) as {
        "monitor-id": number;
      }[];
      if (monitors.length < 2) context.skip();
      const before = (await columns()).stacks[0];
      await ymsp("focus-next-display");
      await ymsp("focus-previous-display");
      await focus(before.id);
      await ymsp("move-window-to-next-display");
      expect((await testWindows()).find((w) => w.id === before.id)?.display).not.toBe(
        before.display,
      );
      await focus(before.id);
      await ymsp("move-window-to-previous-display");
      expect((await testWindows()).find((w) => w.id === before.id)?.display).toBe(before.display);
      await ymsp("focus-space", workspace);
      expect((await columns()).ordered).toHaveLength(6);
    }, 30000);
  });
});
