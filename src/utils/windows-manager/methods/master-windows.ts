import type { Window } from "#types";
import { getConfig } from "#utils/config.ts";
import type { WindowsManager } from "#utils/windows-manager/class.ts";

/**
	If the master position is on the right, a window which is to the right of the dividing line is considered a master window.
	If the master position is on the left, a window that is touching the left edge is considered a master window.
*/
export function isMasterWindow(this: WindowsManager, window: Window) {
  if (getConfig(this.runtime).masterPosition === "right") {
    const dividingLineXCoordinate = this.getDividingLineXCoordinate();
    return window.frame.x >= dividingLineXCoordinate;
  } else {
    return this.isWindowTouchingLeftEdge(window);
  }
}

export function getMasterWindows(this: WindowsManager) {
  if (getConfig(this.runtime).masterPosition === "right") {
    const dividingLineXCoordinate = this.getDividingLineXCoordinate();
    return this.windowsData.filter((window) => window.frame.x >= dividingLineXCoordinate);
  } else {
    return this.windowsData.filter((window) => this.isWindowTouchingLeftEdge(window));
  }
}

export function getTopMasterWindow(this: WindowsManager) {
  return this.getTopWindow(this.getMasterWindows());
}

export function getBottomMasterWindow(this: WindowsManager) {
  return this.getBottomWindow(this.getMasterWindows());
}

export function getWidestMasterWindow(this: WindowsManager) {
  let widestMasterWindow: Window | undefined;
  for (const window of this.getMasterWindows()) {
    if (widestMasterWindow === undefined || window.frame.w > widestMasterWindow.frame.w) {
      widestMasterWindow = window;
    }
  }

  return widestMasterWindow;
}

export async function moveWindowToMaster(this: WindowsManager, window: Window) {
  const current = this.windowsData.find((w) => w.id === window.id);
  if (!current || this.isMasterWindow(current)) return;
  await this.relayoutWindows(current);
}

/**
	Turns the master into a column by making sure the split direction of all the master windows
	is horizontal.
 */
export async function columnizeMasterWindows(this: WindowsManager) {
  const masterWindows = this.getMasterWindows();
  if (masterWindows.length > 1) {
    for (const masterWindow of masterWindows) {
      const window = this.getUpdatedWindowData(masterWindow);
      const splitType = window["split-type"];

      if (splitType === "vertical") {
        // eslint-disable-next-line no-await-in-loop
        await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
      }
    }
  }
}
