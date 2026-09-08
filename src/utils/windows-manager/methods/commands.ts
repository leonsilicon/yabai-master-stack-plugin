import { assertTaskLock } from "#utils/task-context.ts";
import type { WindowsManager } from "#utils/windows-manager/class.ts";
import { runYabaiCommand } from "#utils/yabai.ts";
import { queryWindows, usesAerospace } from "#utils/window-manager-backend.ts";
import { executeAerospaceCommand } from "#utils/aerospace-layout.ts";
import { parse } from "shell-quote";

export async function executeYabaiCommand(this: WindowsManager, command: string) {
  assertTaskLock();

  const args = parse(command);
  if (!args.every((arg) => typeof arg === "string"))
    throw new Error("Shell operators are not supported");
  const yabaiOutput = await (usesAerospace()
    ? executeAerospaceCommand(this, args)
    : runYabaiCommand(...args));
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
