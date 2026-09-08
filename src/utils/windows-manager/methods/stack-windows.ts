import type { Window } from "#types";
import { getConfig } from "#utils/config.ts";
import { debug } from "#utils/debug.ts";
import type { WindowsManager } from "#utils/windows-manager/class.ts";

/**
	If the window's frame has an x equal to the x of the display, it is a stack window
*/
export function isStackWindow(this: WindowsManager, window: Window) {
  const line = this.getDividingLineXCoordinate();
  return getConfig(this.runtime).masterPosition === "right"
    ? window.frame.x < line
    : window.frame.x >= line;
}

export function getWidestStackWindow(this: WindowsManager) {
  let widestStackWindow: Window | undefined;
  for (const window of this.getStackWindows()) {
    if (widestStackWindow === undefined || window.frame.w > widestStackWindow.frame.w) {
      widestStackWindow = window;
    }
  }

  return widestStackWindow;
}

export function getTopStackWindow(this: WindowsManager) {
  return this.getTopWindow(this.getStackWindows());
}

export function getBottomStackWindow(this: WindowsManager) {
  return this.getBottomWindow(this.getStackWindows());
}

/**
	In the event that the windows get badly rearranged, we force all windows to become vertically split to ensure that there exists a stack.
	*/
export async function createStack(this: WindowsManager) {
  debug(this.runtime, () => "Creating stack...");

  for (const window of this.windowsData) {
    const splitType = window["split-type"];

    if (splitType === "horizontal") {
      // eslint-disable-next-line no-await-in-loop
      await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
    }
  }

  await this.columnizeStackWindows();
  await this.columnizeMasterWindows();
}

/**
	If the top-right window has a x-coordinate of 0, or if the stack dividing line is equal to 0, then the stack does not exist. This applies to master positions on the left and on the right.
*/
export function doesStackExist(this: WindowsManager) {
  const topRightWindow = this.getTopRightWindow();
  if (topRightWindow === undefined) {
    return false;
  }

  return this.getStackWindows().length > 0;
}

/**
	Turns the stack into a column by making sure the split direction of all the stack windows
	is horizontal
*/
export async function columnizeStackWindows(this: WindowsManager) {
  if (this.expectedCurrentNumMasterWindows === this.windowsData.length) {
    debug(this.runtime, () => "Skipped columnizing stack windows because there is no stack.");
    return;
  }

  const stackWindows = this.getStackWindows();
  if (stackWindows.length > 1) {
    for (const stackWindow of stackWindows) {
      const window = this.getUpdatedWindowData(stackWindow);

      const splitType = window["split-type"];

      if (splitType === "vertical") {
        // eslint-disable-next-line no-await-in-loop
        await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
      }
    }
  }
}

export function getStackWindows(this: WindowsManager) {
  return this.windowsData.filter((window) => this.isStackWindow(window));
}
