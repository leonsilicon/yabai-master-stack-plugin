import type { Display, DisplayIndex } from "#types";
import { runYabai } from "./yabai.ts";
export async function getDisplays(): Promise<Display[]> {
  return JSON.parse(await runYabai("query", "--displays")) as Display[];
}
export async function getFocusedDisplay(): Promise<Display> {
  return JSON.parse(await runYabai("query", "--displays", "--display")) as Display;
}
export async function focusDisplay(displayIndex: DisplayIndex) {
  await runYabai("display", "--focus", String(displayIndex));
}
