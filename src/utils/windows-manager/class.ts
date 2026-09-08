import type { YMSPRuntime } from "#utils/runtime.ts";
import type { Display, Space, Window } from "#types";
import * as windowsManagerMethods from "./methods/index.ts";

class WindowManagerClass {
  runtime: YMSPRuntime;
  insertion?: { id: number; direction: string; masters: number[]; stacks: number[] };
  display: Display;
  space: Space;
  expectedCurrentNumMasterWindows: number;
  windowsData: Window[] = [];
  allWindowsData: Window[] = [];
  focusedWindowData: Window | undefined;
  focusQueryCompleted = false;

  constructor({
    runtime,
    display,
    expectedCurrentNumMasterWindows,
    space,
  }: {
    runtime: YMSPRuntime;
    display: Display;
    space: Space;
    expectedCurrentNumMasterWindows: number;
  }) {
    this.runtime = runtime;
    this.display = display;
    this.space = space;
    this.expectedCurrentNumMasterWindows = expectedCurrentNumMasterWindows;
    Object.assign(this, windowsManagerMethods);
  }
}

export type WindowsManager = InstanceType<typeof WindowManagerClass> & typeof windowsManagerMethods;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const WindowsManager = WindowManagerClass as unknown as {
  new (...args: ConstructorParameters<typeof WindowManagerClass>): WindowsManager;
};
