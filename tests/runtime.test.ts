import { afterAll, beforeEach, expect, test, vi } from "vite-plus/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

const runtime = vi.hoisted(() => ({ lockfilePath: "", spaces: vi.fn() }));
vi.mock("../src/utils/lock.ts", () => runtime);
vi.mock("../src/utils/space.ts", () => ({ getSpaces: runtime.spaces }));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ymsp-runtime-"));
runtime.lockfilePath = path.join(directory, "ymsp.lock");
import { defineTask } from "../src/utils/task.ts";
import { getYabaiOutput, YabaiError } from "../src/utils/yabai.ts";

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));
beforeEach(() => fs.rmSync(runtime.lockfilePath, { force: true }));

test("tasks serialize overlapping API calls and release ownership", async () => {
  const events: string[] = [];
  const task = defineTask(async (id: number) => {
    expect(fs.readFileSync(runtime.lockfilePath, "utf8")).toBe(String(process.pid));
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
  fs.writeFileSync(runtime.lockfilePath, String(process.pid));
  let entered = false;
  const pending = defineTask(async () => {
    entered = true;
  })();
  await setTimeout(40);
  expect(entered).toBe(false);
  expect(fs.readFileSync(runtime.lockfilePath, "utf8")).toBe(String(process.pid));
  fs.unlinkSync(runtime.lockfilePath);
  await pending;
  expect(entered).toBe(true);
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
