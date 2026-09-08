import type { YabaiMasterStackPluginConfig } from "#types";
import type { YMSPRuntime } from "./runtime.ts";
import fs from "node:fs";

export function resolveConfig(config: Partial<YabaiMasterStackPluginConfig> = {}) {
  const result = {
    windowManager: "yabai",
    aerospacePath: "/opt/homebrew/bin/aerospace",
    masterPosition: "right",
    resizeIncrement: 50,
    moveNewWindowsToMaster: false,
    debug: false,
    yabaiPath: "/usr/local/bin/yabai",
    ...config,
  } satisfies Required<YabaiMasterStackPluginConfig>;
  if (!["yabai", "aerospace"].includes(result.windowManager))
    throw new Error("windowManager must be yabai or aerospace");
  if (!["left", "right"].includes(result.masterPosition))
    throw new Error("masterPosition must be left or right");
  if (!Number.isFinite(result.resizeIncrement) || result.resizeIncrement <= 0)
    throw new Error("resizeIncrement must be positive");
  return Object.freeze(result);
}

/** File configuration is opt-in; no implicit path, environment lookup, or cache. */
export function readConfig(configPath: string) {
  return resolveConfig(
    JSON.parse(fs.readFileSync(configPath, "utf8")) as Partial<YabaiMasterStackPluginConfig>,
  );
}

export function getConfig(runtime: YMSPRuntime) {
  return runtime.config;
}
