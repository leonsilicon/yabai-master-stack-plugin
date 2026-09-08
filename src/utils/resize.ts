import type { YMSPRuntime } from "#utils/runtime.ts";
import { getConfig } from "./config.ts";
import { createInitializedWindowsManager } from "./windows-manager.ts";

export async function resize(runtime: YMSPRuntime, axis: "width" | "height", direction: 1 | -1) {
  const { wm } = await createInitializedWindowsManager(runtime);
  const focused = wm.getFocusedWindow();
  if (!focused || !wm.windowsData.some((w) => w.id === focused.id)) return;
  const increment = getConfig(runtime).resizeIncrement * direction;
  let edge: string;
  let delta: number;
  if (axis === "width") {
    if (!wm.doesStackExist()) return;
    const rightMaster = getConfig(runtime).masterPosition === "right";
    edge = wm.isMasterWindow(focused) === rightMaster ? "left" : "right";
    delta = rightMaster ? -increment : increment;
    await wm.executeYabaiCommand(`-m window ${focused.id} --resize ${edge}:${delta}:0`);
  } else {
    const column = wm.isMasterWindow(focused) ? wm.getMasterWindows() : wm.getStackWindows();
    if (column.length < 2) return;
    const top = wm.isTopWindow(column, focused);
    edge = top ? "bottom" : "top";
    delta = top ? increment : -increment;
    await wm.executeYabaiCommand(`-m window ${focused.id} --resize ${edge}:0:${delta}`);
  }
}
