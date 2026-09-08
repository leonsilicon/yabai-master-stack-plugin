import type { Space } from "#types";
import { runWindowManager } from "./window-manager-backend.ts";

export async function getSpaces() {
  return JSON.parse(await runWindowManager("query", "--spaces")) as Space[];
}

export async function getFocusedSpace() {
  return JSON.parse(await runWindowManager("query", "--spaces", "--space")) as Space;
}
