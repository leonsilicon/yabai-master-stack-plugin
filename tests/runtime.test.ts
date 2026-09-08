import { afterAll, afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import lockfile from "proper-lockfile";

const runtime = vi.hoisted(() => ({ lockfilePath: "", spaces: vi.fn() }));
vi.mock("../src/utils/lock.ts", async (original) => ({
  ...(await original<typeof import("../src/utils/lock.ts")>()),
  get lockfilePath() {
    return runtime.lockfilePath;
  },
}));
vi.mock("../src/utils/space.ts", () => ({ getSpaces: runtime.spaces }));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ymsp-runtime-"));
runtime.lockfilePath = path.join(directory, "task.lock");
import { defineTask, withTaskLock } from "../src/utils/task.ts";
import { taskLockOptions } from "../src/utils/lock.ts";
import { assertTaskLock, getTaskSignal } from "../src/utils/task-context.ts";
import { getYabaiOutput, YabaiError } from "../src/utils/yabai.ts";

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));
beforeEach(() => fs.rmSync(runtime.lockfilePath, { force: true, recursive: true }));
afterEach(() => vi.restoreAllMocks());

test("tasks serialize overlapping API calls and release ownership", async () => {
  const events: string[] = [];
  const task = defineTask(async (id: number) => {
    expect(fs.statSync(runtime.lockfilePath).isDirectory()).toBe(true);
    assertTaskLock();
    events.push(`start${id}`);
    await setTimeout(10);
    events.push(`end${id}`);
  });
  await Promise.all([task(1), task(2)]);
  expect(events).toEqual(["start1", "end1", "start2", "end2"]);
  expect(fs.existsSync(runtime.lockfilePath)).toBe(false);
});

test("failed tasks reject, release ownership, and do not poison the queue", async () => {
  await expect(
    defineTask(async () => {
      throw new Error("failed");
    })(),
  ).rejects.toThrow("failed");
  expect(fs.existsSync(runtime.lockfilePath)).toBe(false);
  await defineTask(async () => {})();
});

test("waits for an existing owner instead of deleting its lock", async () => {
  const release = await lockfile.lock(runtime.lockfilePath, {
    ...taskLockOptions,
    lockfilePath: runtime.lockfilePath,
  });
  let entered = false;
  const pending = defineTask(async () => {
    entered = true;
  })();
  await setTimeout(40);
  expect(entered).toBe(false);
  expect(fs.statSync(runtime.lockfilePath).isDirectory()).toBe(true);
  await release();
  await pending;
  expect(entered).toBe(true);
});

test("recovers an abandoned stale heartbeat directory", async () => {
  fs.mkdirSync(runtime.lockfilePath);
  const stale = new Date(Date.now() - taskLockOptions.stale - 1000);
  fs.utimesSync(runtime.lockfilePath, stale, stale);
  await withTaskLock(async () => {
    assertTaskLock();
  });
  expect(fs.existsSync(runtime.lockfilePath)).toBe(false);
});

test("nested tasks share ownership and preserve arguments and return values", async () => {
  const received: number[] = [];
  const nested = defineTask(async (value: number) => {
    received.push(value);
    assertTaskLock();
  });
  expect(
    await withTaskLock(async () => {
      await nested(7);
      await nested(8);
      return 42;
    }),
  ).toBe(42);
  expect(received).toEqual([7, 8]);
  expect(fs.existsSync(runtime.lockfilePath)).toBe(false);
});

test("ownership cannot be borrowed by unrelated or detached API work", async () => {
  const entered = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<void>();
  const detached = Promise.withResolvers<void>();
  let late: Promise<void> | undefined;
  const pending = withTaskLock(async () => {
    entered.resolve();
    late = detached.promise.then(() => {
      assertTaskLock();
    });
    await finish.promise;
  });
  await entered.promise;
  expect(assertTaskLock).toThrow(/No active ymsp task lock/);
  finish.resolve();
  await pending;
  detached.resolve();
  await expect(late).rejects.toMatchObject({ code: "ELOCKED" });
});

test("compromised ownership aborts work, rejects the task, and leaves the queue usable", async () => {
  const entered = Promise.withResolvers<void>();
  let signal: AbortSignal | undefined;
  const pending = withTaskLock(async () => {
    signal = getTaskSignal();
    entered.resolve();
    await new Promise<void>((resolve) =>
      signal!.addEventListener("abort", () => resolve(), { once: true }),
    );
    expect(assertTaskLock).toThrow();
    expect(getTaskSignal).toThrow();
  });
  const rejection = expect(pending).rejects.toMatchObject({ code: "ECOMPROMISED" });
  await entered.promise;
  fs.rmdirSync(runtime.lockfilePath);
  await rejection;
  expect(signal!.aborted).toBe(true);
  await withTaskLock(async () => {
    assertTaskLock();
  });
});

test("lock contention errors identify the shared path without poisoning the queue", async () => {
  vi.spyOn(lockfile, "lock").mockRejectedValueOnce(
    Object.assign(new Error("locked"), { code: "ELOCKED" }),
  );
  await expect(withTaskLock(async () => {})).rejects.toThrow(
    `Timed out waiting for the ymsp task lock (${runtime.lockfilePath})`,
  );
  await withTaskLock(async () => {
    assertTaskLock();
  });
});

test("yabai errors include stderr and status", async () => {
  await expect(
    getYabaiOutput({
      stdout: new Response("").body!,
      stderr: new Response("failed to connect to socket").body!,
      exited: Promise.resolve(1),
    }),
  ).rejects.toMatchObject({
    name: "YabaiError",
    exitCode: 1,
    stderr: "failed to connect to socket",
  });
  expect(new YabaiError(1, "", "failure")).toBeInstanceOf(Error);
});

test("reading output waits for subprocess completion", async () => {
  let resolve!: (value: number) => void;
  let complete = false;
  const pending = getYabaiOutput({
    stdout: new Response("ok").body!,
    exited: new Promise<number>((done) => {
      resolve = done;
    }),
  }).then((value) => {
    complete = true;
    return value;
  });
  await setTimeout(5);
  expect(complete).toBe(false);
  resolve(0);
  expect(await pending).toBe("ok");
});
