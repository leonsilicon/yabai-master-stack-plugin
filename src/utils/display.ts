import type { YMSPRuntime } from "#utils/runtime.ts";
import type { Display, DisplayIndex } from "#types";
import { runWindowManager } from "./window-manager-backend.ts";
export async function getDisplays(runtime: YMSPRuntime): Promise<Display[]> {
  return JSON.parse(await runWindowManager(runtime, "query", "--displays")) as Display[];
}
export async function getFocusedDisplay(runtime: YMSPRuntime): Promise<Display> {
  return JSON.parse(await runWindowManager(runtime, "query", "--displays", "--display")) as Display;
}
export async function focusDisplay(runtime: YMSPRuntime, displayIndex: DisplayIndex) {
  await runWindowManager(runtime, "display", "--focus", String(displayIndex));
}
