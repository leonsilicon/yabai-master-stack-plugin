import { assertTaskLock } from "#utils/task-context.ts";
import type { WindowsManager } from "#utils/windows-manager/class.ts";
import { runYabaiCommand } from "#utils/yabai.ts";
import { queryWindows, usesAerospace } from "#utils/window-manager-backend.ts";
import { executeAerospaceCommand } from "#utils/aerospace-layout.ts";
import { parse } from "shell-quote";

export async function executeYabaiCommand(this: WindowsManager, command: string) {
  assertTaskLock(this.runtime);

  const args = parse(command);
  if (!args.every((arg) => typeof arg === "string"))
    throw new Error("Shell operators are not supported");
  const yabaiOutput = await (usesAerospace(this.runtime)
    ? executeAerospaceCommand(this, args)
    : runYabaiCommand(this.runtime, ...args));
  await this.refreshWindowsData();
  return yabaiOutput;
}

/** Idempotent toggling also makes partial rebuild recovery safe. */
export async function setWindowFloating(this: WindowsManager, id: number, floating: boolean) {
  const window = (await queryWindows(this.runtime)).find((w) => w.id === id);
  if (window && window["is-floating"] !== floating) {
    await this.executeYabaiCommand(`-m window ${id} --toggle float`);
  }
}
