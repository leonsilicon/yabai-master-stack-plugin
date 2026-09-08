import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  YMSP,
  getConfig,
  readState,
  writeState,
  queryWindows,
  debug,
  type YMSPOptions,
} from "../src/+.ts";
import { assertTaskLock } from "../src/utils/task-context.ts";

let directory: string;
const spawn = vi.fn();
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "ymsp-instance-"));
  vi.stubEnv("YMSP_CONFIG_DIR", directory);
  vi.stubEnv("YABAI_WINDOW_ID", "999");
  fs.writeFileSync(path.join(directory, "ymsp.config.json"), "invalid config");
  spawn.mockReset().mockImplementation(() => ({
    stdout: new Response("[]").body,
    stderr: new Response("").body,
    exited: Promise.resolve(0),
  }));
  vi.stubGlobal("Bun", { spawn });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fs.rmSync(directory, { recursive: true, force: true });
});

test("the default API runs without reading or writing any global files or environment", async () => {
  const read = vi.spyOn(fs, "readFileSync");
  const write = vi.spyOn(fs, "writeFileSync");
  const mkdir = vi.spyOn(fs, "mkdirSync");
  const ymsp = new YMSP();
  await ymsp.tasks.windowDestroyed();
  await ymsp.tasksMap["window-created"](42);
  expect(getConfig(ymsp)).toMatchObject({ windowManager: "yabai", masterPosition: "right" });
  expect(spawn.mock.calls[0][0][0]).toBe("/usr/local/bin/yabai");
  expect(spawn.mock.calls[0][1].env).toEqual({});
  expect(read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  expect(mkdir).not.toHaveBeenCalled();
});

test("overlapping instances keep backend, executable, environment, and config settings isolated", async () => {
  const options: YMSPOptions = {
    windowManager: "aerospace",
    aerospacePath: "/explicit/aerospace",
    masterPosition: "left",
    resizeIncrement: 75,
    environment: { TEST: "aero" },
  };
  const aero = new YMSP(options);
  const yabai = new YMSP({ yabaiPath: "/explicit/yabai", environment: { TEST: "yabai" } });
  options.windowManager = "yabai";
  options.environment!.TEST = "changed";
  const entered = Promise.withResolvers<void>();
  const resume = Promise.withResolvers<void>();
  const first = aero.withTaskLock(async () => {
    entered.resolve();
    await resume.promise;
    await aero.tasks.windowDestroyed();
    expect(getConfig(aero)).toMatchObject({ masterPosition: "left", resizeIncrement: 75 });
  });
  await entered.promise;
  // Independent runtimes must not share the old module-level queue.
  await yabai.tasks.windowDestroyed();
  resume.resolve();
  await first;
  expect(spawn.mock.calls.map(([argv]) => argv[0])).toEqual([
    "/explicit/yabai",
    "/explicit/aerospace",
  ]);
  expect(spawn.mock.calls.map(([, options]) => options.env.TEST)).toEqual(["yabai", "aero"]);
  expect(getConfig(yabai).masterPosition).toBe("right");
});

test("in-memory master counts belong to the instance and are copied at the boundary", async () => {
  const first = new YMSP({ windowManager: "aerospace" });
  const second = new YMSP({ windowManager: "aerospace" });
  const state = { Work: { numMasterWindows: 3 } };
  writeState(first, state);
  state.Work.numMasterWindows = 99;
  const snapshot = await readState(first);
  expect(snapshot.Work.numMasterWindows).toBe(3);
  snapshot.Work.numMasterWindows = 10;
  expect((await readState(first)).Work.numMasterWindows).toBe(3);
  expect(await readState(second)).toEqual({});
});

test("disk persistence and lock ownership use the exact explicitly supplied paths", async () => {
  const stateFilePath = path.join(directory, "custom", "counts.json");
  const lockfilePath = path.join(directory, "coordination", "desktop.lock");
  const first = new YMSP({ windowManager: "aerospace", stateFilePath, lockfilePath });
  const second = new YMSP({ windowManager: "aerospace", stateFilePath, lockfilePath });
  await first.withTaskLock(async () => {
    expect(fs.statSync(lockfilePath).isDirectory()).toBe(true);
    assertTaskLock(first);
    expect(() => assertTaskLock(second)).toThrow("No active ymsp task lock");
    writeState(first, { Work: { numMasterWindows: 4 } });
  });
  expect(fs.existsSync(lockfilePath)).toBe(false);
  expect(await readState(second)).toEqual({ Work: { numMasterWindows: 4 } });
  expect(fs.readdirSync(directory).sort()).toEqual(["coordination", "custom", "ymsp.config.json"]);
});

test("failed instance tasks release their queue and cannot affect another instance", async () => {
  const first = new YMSP();
  const second = new YMSP({ windowManager: "aerospace" });
  spawn.mockImplementationOnce(() => ({
    stdout: new Response("").body,
    stderr: new Response("failed").body,
    exited: Promise.resolve(1),
  }));
  await expect(first.tasks.windowDestroyed()).rejects.toThrow("failed");
  await first.tasks.windowDestroyed();
  await second.tasks.windowDestroyed();
});

test("watcher coordination and debug output are explicit options", async () => {
  const logger = vi.fn();
  const watcherLockfilePath = path.join(directory, "watcher.lock");
  const ymsp = new YMSP({ windowManager: "aerospace", watcherLockfilePath, debug: true, logger });
  await ymsp.tasks.watchAerospace(AbortSignal.abort());
  expect(fs.existsSync(watcherLockfilePath)).toBe(false);
  expect(ymsp.watching).toBe(false);
  debug(ymsp, () => "instance debug");
  expect(logger).toHaveBeenCalledExactlyOnceWith("instance debug");
  expect(spawn).not.toHaveBeenCalled();
});

test("unbound helpers also require an explicit runtime", async () => {
  const ymsp = new YMSP({ windowManager: "aerospace", aerospacePath: "/api/aerospace" });
  expect(await queryWindows(ymsp)).toEqual([]);
  expect(spawn.mock.calls[0][0][0]).toBe("/api/aerospace");
});
