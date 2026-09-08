import { getConfig } from "#utils/config.ts";
import { lockfilePath } from "#utils/lock.ts";
import type { WindowsManager } from "#utils/windows-manager/class.ts";
import { getYabaiOutput, queryWindows } from "#utils/yabai.ts";
import fs from "node:fs";
import { parse } from "shell-quote";

export async function executeYabaiCommand(this: WindowsManager, command: string) {
  const { yabaiPath } = getConfig();
  try {
    // We should check that we still own the lockfile before running the command
    if (fs.readFileSync(lockfilePath, "utf8") !== process.pid.toString()) {
      throw Object.assign(new Error("Lockfile is no longer owned by this process"), {
        code: "ELOCKED",
      });
    }
  } catch {
    // If the file was deleted, we should assume it was deleted by another process
    throw Object.assign(new Error("Lockfile is no longer owned by this process"), {
      code: "ELOCKED",
    });
  }

  const args = parse(command);
  if (!args.every((arg) => typeof arg === "string"))
    throw new Error("Shell operators are not supported");
  const yabaiProcess = Bun.spawn([yabaiPath, ...args], { stdout: "pipe", stderr: "pipe" });
  const yabaiOutput = await getYabaiOutput(yabaiProcess);
  await this.refreshWindowsData();
  return yabaiOutput;
}

/** Idempotent toggling also makes partial rebuild recovery safe. */
export async function setWindowFloating(this: WindowsManager, id: number, floating: boolean) {
  const window = (await queryWindows()).find((w) => w.id === id);
  if (window && window["is-floating"] !== floating) {
    await this.executeYabaiCommand(`-m window ${id} --toggle float`);
  }
}
