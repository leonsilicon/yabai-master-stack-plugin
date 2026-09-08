import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
let directory: string;
beforeEach(() => {
  vi.resetModules();
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "ymsp-config-"));
  vi.stubEnv("YMSP_CONFIG_DIR", directory);
});
afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(directory, { recursive: true, force: true });
});
async function read(value: object) {
  fs.writeFileSync(path.join(directory, "ymsp.config.json"), JSON.stringify(value));
  return (await import("../src/utils/config.ts")).getConfig();
}
test("existing configuration defaults to yabai", async () => {
  expect(await read({ yabaiPath: "/custom/yabai" })).toMatchObject({
    windowManager: "yabai",
    yabaiPath: "/custom/yabai",
  });
});
test("AeroSpace selection requires no yabai configuration", async () => {
  expect(
    await read({ windowManager: "aerospace", aerospacePath: "/custom/aerospace" }),
  ).toMatchObject({ windowManager: "aerospace", aerospacePath: "/custom/aerospace" });
});
test("rejects misspelled manager settings", async () => {
  await expect(read({ windowManager: "aerospce" })).rejects.toThrow(
    "windowManager must be yabai or aerospace",
  );
});
