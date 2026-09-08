import { getConfig } from "./config.ts";
import * as yabai from "./yabai.ts";
import {
  getAerospaceDisplays,
  getAerospaceSpaces,
  queryAerospaceWindows,
  runAerospace,
} from "./aerospace.ts";

export const usesAerospace = () => getConfig().windowManager === "aerospace";
export const queryWindows = () =>
  usesAerospace() ? queryAerospaceWindows() : yabai.queryWindows();
export const queryFocusedWindow = async () =>
  usesAerospace() ? (await queryAerospaceWindows(true))[0] : yabai.queryFocusedWindow();

/** Internal compatibility vocabulary; public runYabai always invokes yabai. */
export async function runWindowManager(...args: string[]): Promise<string> {
  if (!usesAerospace()) return yabai.runYabai(...args);
  const [entity, action, value, target] = args;
  if (entity === "query") {
    if (action === "--spaces") {
      const spaces = await getAerospaceSpaces();
      return JSON.stringify(value ? spaces.find((s) => s["has-focus"]) : spaces);
    }
    if (action === "--displays") {
      const displays = await getAerospaceDisplays(Boolean(value));
      return JSON.stringify(value ? displays[0] : displays);
    }
  }
  if (entity === "space" && action === "--focus") return runAerospace("workspace", "--", value);
  if (entity === "display" && action === "--focus") return runAerospace("focus-monitor", value);
  if (entity === "window" && value === "--space")
    return runAerospace("move-node-to-workspace", "--window-id", action, "--", target);
  if (entity === "window" && value === "--display")
    return runAerospace("move-node-to-monitor", "--window-id", action, target);
  throw new Error(`Unsupported AeroSpace operation: ${args.join(" ")}`);
}
