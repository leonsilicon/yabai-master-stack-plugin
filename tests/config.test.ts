import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readConfig, resolveConfig } from "../src/utils/config.ts";
let directory: string;
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "ymsp-config-"));
});
afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(directory, { recursive: true, force: true });
});
function read(value: object) {
  const configPath = path.join(directory, "ymsp.config.json");
  fs.writeFileSync(configPath, JSON.stringify(value));
  return readConfig(configPath);
}
test("existing configuration defaults to yabai", () => {
  expect(read({ yabaiPath: "/custom/yabai" })).toMatchObject({
    windowManager: "yabai",
    yabaiPath: "/custom/yabai",
  });
});
test("AeroSpace selection requires no yabai configuration", () => {
  expect(read({ windowManager: "aerospace", aerospacePath: "/custom/aerospace" })).toMatchObject({
    windowManager: "aerospace",
    aerospacePath: "/custom/aerospace",
  });
});
test("file configuration is read only from the explicit path and is not cached", () => {
  vi.stubEnv("YMSP_CONFIG_DIR", "/does-not-exist");
  expect(read({ masterPosition: "left" }).masterPosition).toBe("left");
  expect(read({ masterPosition: "right" }).masterPosition).toBe("right");
});
test("rejects misspelled manager settings from files", () => {
  expect(() => read({ windowManager: "aerospce" })).toThrow(
    "windowManager must be yabai or aerospace",
  );
});
test.each([0, -1, NaN, Infinity])("rejects invalid API resize increment %s", (resizeIncrement) => {
  expect(() => resolveConfig({ resizeIncrement })).toThrow("resizeIncrement must be positive");
});
