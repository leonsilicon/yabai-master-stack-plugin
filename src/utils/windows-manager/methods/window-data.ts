import type { Window } from "#types";
import type { WindowsManager } from "#utils/windows-manager/class.ts";
import { queryWindows, queryFocusedWindow } from "#utils/window-manager-backend.ts";
import invariant from "tiny-invariant";

export async function getWindowsData(this: WindowsManager) {
  this.allWindowsData = await queryWindows();
  const windowsData = this.allWindowsData.filter((window) => {
    const isFloating = window["is-floating"];

    if (window.subrole === "AXDialog" || window["is-native-fullscreen"]) return false;

    // Window should not be floating
    if (isFloating || window.display !== this.display.index || window.space !== this.space.index) {
      return false;
    }

    const isMinimized = window["is-minimized"];
    const isHidden = window["is-hidden"];
    const isVisible = window["is-visible"];
    if (
      isMinimized ||
      isHidden ||
      (!isVisible && this.space["is-visible"] !== 0 && this.space["is-visible"] !== false)
    )
      return false;

    return true;
  });
  return windowsData;
}

export async function refreshWindowsData(this: WindowsManager) {
  const newWindowsData = await this.getWindowsData();
  this.windowsData = newWindowsData;
  this.focusedWindowData = await queryFocusedWindow();
  this.focusQueryCompleted = true;
}

export async function initialize(this: WindowsManager) {
  await this.refreshWindowsData();
}

export function getUpdatedWindowData(this: WindowsManager, window: Window) {
  return this.windowsData.find((win) => window.id === win.id)!;
}

export function getWindowData(
  this: WindowsManager,
  {
    processId,
    windowId,
  }: {
    processId?: string;
    windowId?: string;
  },
): Window {
  if (processId === undefined && windowId === undefined) {
    throw new Error("Must provide at least one of processId or windowId");
  }

  const windowData = this.windowsData.find((window) =>
    windowId !== undefined ? window.id === Number(windowId) : window.pid === Number(processId),
  );

  if (windowData === undefined) {
    if (processId === undefined) {
      invariant(windowId);
      throw new Error(`Window with id ${windowId} not found.`);
    } else {
      throw new Error(`Window with pid ${processId} not found.`);
    }
  }

  return windowData;
}

export function getFocusedWindow(this: WindowsManager): Window | undefined {
  if (this.focusQueryCompleted) return this.focusedWindowData;
  return (
    this.allWindowsData.find((w) => w["has-focus"]) ?? this.windowsData.find((w) => w["has-focus"])
  );
}
