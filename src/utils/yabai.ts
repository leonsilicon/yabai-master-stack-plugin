import type { YMSPRuntime } from "#utils/runtime.ts";
import { getConfig } from "./config.ts";
import type { Window } from "#types";
import { getTaskSignal } from "./task-context.ts";

export class YabaiError extends Error {
  constructor(
    public exitCode: number,
    public stdout: string,
    public stderr: string,
  ) {
    super(`Yabai command failed (${exitCode}): ${stderr || stdout}`);
    this.name = "YabaiError";
  }
}

/** Drain both pipes before checking exit status, including socket/permission failures. */
export async function getYabaiOutput(child: {
  stdout: ReadableStream<Uint8Array>;
  stderr?: ReadableStream<Uint8Array> | number | undefined;
  exited?: Promise<number>;
}): Promise<string> {
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    child.stderr instanceof ReadableStream ? new Response(child.stderr).text() : "",
    child.exited ?? Promise.resolve(0),
  ]);
  if (code !== 0) throw new YabaiError(code, stdout, stderr);
  return stdout;
}

export async function runYabaiCommand(runtime: YMSPRuntime, ...args: string[]): Promise<string> {
  const signal = getTaskSignal(runtime);
  const result = await getYabaiOutput(
    runtime.spawn([getConfig(runtime).yabaiPath, ...args], {
      env: runtime.environment,
      stdout: "pipe",
      stderr: "pipe",
      ...(signal ? { signal } : {}),
    }),
  );
  getTaskSignal(runtime);
  return result;
}

export async function runYabai(runtime: YMSPRuntime, ...args: string[]): Promise<string> {
  return runYabaiCommand(runtime, "-m", ...args);
}

export async function queryWindows(runtime: YMSPRuntime): Promise<Window[]> {
  return JSON.parse(await runYabai(runtime, "query", "--windows")) as Window[];
}

/** The focused query is authoritative even when has-focus is false. */
export async function queryFocusedWindow(runtime: YMSPRuntime): Promise<Window | undefined> {
  try {
    const window = JSON.parse(await runYabai(runtime, "query", "--windows", "--window")) as Window;
    return Number.isInteger(window.id) ? window : undefined;
  } catch (error) {
    if (
      error instanceof YabaiError &&
      /could not retrieve window details/i.test(error.stderr + error.stdout)
    )
      return undefined;
    throw error;
  }
}
