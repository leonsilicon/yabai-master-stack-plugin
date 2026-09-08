import type { YabaiMasterStackPluginConfig } from "#types";
import * as fs from "node:fs";
import { configDirectory } from "./config-directory.ts";
import onetime from "onetime";
import path from "pathe";

export const getConfig = onetime(() => {
  try {
    const configPath = path.join(configDirectory, "ymsp.config.json");

    const config = JSON.parse(
      fs.readFileSync(configPath).toString(),
    ) as Partial<YabaiMasterStackPluginConfig>;

    const defaultConfig: YabaiMasterStackPluginConfig = {
      windowManager: "yabai",
      aerospacePath: "/opt/homebrew/bin/aerospace",
      masterPosition: "right",
      resizeIncrement: 50,
      moveNewWindowsToMaster: false,
      debug: false,
      yabaiPath: "/usr/local/bin/yabai",
    };

    const result = { ...defaultConfig, ...config };
    if (!["yabai", "aerospace"].includes(result.windowManager!))
      throw new Error("windowManager must be yabai or aerospace");
    if (!["left", "right"].includes(result.masterPosition))
      throw new Error("masterPosition must be left or right");
    if (!Number.isFinite(result.resizeIncrement) || result.resizeIncrement! <= 0)
      throw new Error("resizeIncrement must be positive");
    return result;
  } catch (error: unknown) {
    const err = error as Error & { code: string };
    if (err.code === "ENOENT") {
      throw new Error("The config file at ~/.config/ymsp/ymsp.config.json file was not found.");
    } else {
      throw err;
    }
  }
});
