import type { Display, DisplayIndex } from "#types";
import { runWindowManager } from "./window-manager-backend.ts";
export async function getDisplays(): Promise<Display[]> {
  return JSON.parse(await runWindowManager("query", "--displays")) as Display[];
}
export async function getFocusedDisplay(): Promise<Display> {
  return JSON.parse(await runWindowManager("query", "--displays", "--display")) as Display;
}
export async function focusDisplay(displayIndex: DisplayIndex) {
  await runWindowManager("display", "--focus", String(displayIndex));
}
