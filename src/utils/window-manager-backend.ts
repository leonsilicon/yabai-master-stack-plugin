import type { YMSPRuntime } from "#utils/runtime.ts";
import { getConfig } from "./config.ts";
import * as yabai from "./yabai.ts";
import {
  getAerospaceDisplays,
  getAerospaceSpaces,
  queryAerospaceWindows,
  runAerospace,
} from "./aerospace.ts";

export const usesAerospace = (runtime: YMSPRuntime) =>
  getConfig(runtime).windowManager === "aerospace";
export const queryWindows = (runtime: YMSPRuntime) =>
  usesAerospace(runtime) ? queryAerospaceWindows(runtime) : yabai.queryWindows(runtime);
export const queryFocusedWindow = async (runtime: YMSPRuntime) =>
  usesAerospace(runtime)
    ? (await queryAerospaceWindows(runtime, true))[0]
    : yabai.queryFocusedWindow(runtime);

/** Internal compatibility vocabulary; public runYabai always invokes yabai. */
export async function runWindowManager(runtime: YMSPRuntime, ...args: string[]): Promise<string> {
  if (!usesAerospace(runtime)) return yabai.runYabai(runtime, ...args);
  const [entity, action, value, target] = args;
  if (entity === "query") {
    if (action === "--spaces") {
      const spaces = await getAerospaceSpaces(runtime);
      return JSON.stringify(value ? spaces.find((s) => s["has-focus"]) : spaces);
    }
    if (action === "--displays") {
      const displays = await getAerospaceDisplays(runtime, Boolean(value));
      return JSON.stringify(value ? displays[0] : displays);
    }
  }
  if (entity === "space" && action === "--focus")
    return runAerospace(runtime, "workspace", "--", value);
  if (entity === "display" && action === "--focus")
    return runAerospace(runtime, "focus-monitor", value);
  if (entity === "window" && value === "--space")
    return runAerospace(runtime, "move-node-to-workspace", "--window-id", action, "--", target);
  if (entity === "window" && value === "--display")
    return runAerospace(runtime, "move-node-to-monitor", "--window-id", action, target);
  throw new Error(`Unsupported AeroSpace operation: ${args.join(" ")}`);
}
