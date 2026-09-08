import os from "node:os";
import path from "pathe";
export const configDirectory =
  process.env.YMSP_CONFIG_DIR ?? path.join(os.homedir(), ".config/ymsp");
