import * as tasks from "./tasks/_.ts";

export const tasksMap = {
  "close-focused-window": tasks.closeFocusedWindow,
  "decrease-master-window-count": tasks.decreaseMasterWindowCount,
  "focus-down-window": tasks.focusDownWindow,
  "focus-up-window": tasks.focusUpWindow,
  "increase-master-window-count": tasks.increaseMasterWindowCount,
  "on-yabai-start": tasks.onYabaiStart,
  "window-created": tasks.windowCreated,
  "window-moved": tasks.windowMoved,
  "focus-next-display": tasks.focusNextDisplay,
  "focus-previous-display": tasks.focusPreviousDisplay,
  "move-window-to-next-display": tasks.moveWindowToNextDisplay,
  "move-window-to-previous-display": tasks.moveWindowToPreviousDisplay,
  "move-window-to-master": tasks.moveWindowToMaster,
  "focus-master-window": tasks.focusMasterWindow,
  "move-window-up": tasks.moveWindowUp,
  "move-window-down": tasks.moveWindowDown,
  "increase-master-width": tasks.increaseMasterWidth,
  "decrease-master-width": tasks.decreaseMasterWidth,
  "increase-window-height": tasks.increaseWindowHeight,
  "decrease-window-height": tasks.decreaseWindowHeight,
  relayout: tasks.relayout,
  "toggle-float-focused-window": tasks.toggleFloatFocusedWindow,
  "minimize-focused-window": tasks.minimizeFocusedWindow,
  "window-destroyed": tasks.windowDestroyed,
  "focus-space": tasks.focusSpace,
  "move-window-to-space": tasks.moveWindowToSpace,
} satisfies Record<string, (...args: never[]) => Promise<void>>;

export type TaskName = keyof typeof tasksMap;
