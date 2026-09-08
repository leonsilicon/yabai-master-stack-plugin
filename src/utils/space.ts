import type { YMSPRuntime } from "#utils/runtime.ts";
import type { Space } from "#types";
import { runWindowManager } from "./window-manager-backend.ts";

export async function getSpaces(runtime: YMSPRuntime) {
  return JSON.parse(await runWindowManager(runtime, "query", "--spaces")) as Space[];
}

export async function getFocusedSpace(runtime: YMSPRuntime) {
  return JSON.parse(await runWindowManager(runtime, "query", "--spaces", "--space")) as Space;
}
