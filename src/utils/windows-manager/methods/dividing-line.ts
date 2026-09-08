import { getConfig } from "#utils/config.ts";
import type { WindowsManager } from "#utils/windows-manager/class.ts";

export function getLeftLineXCoordinate(this: WindowsManager): number {
  return this.windowsData.length
    ? Math.min(...this.windowsData.map((w) => w.frame.x))
    : this.display.frame.x;
}

export function getDividingLineXCoordinate(this: WindowsManager): number {
  return getConfig(this.runtime).masterPosition === "right"
    ? (this.getTopRightWindow()?.frame.x ?? this.display.frame.x)
    : this.getLeftLineXCoordinate() + 1;
}
