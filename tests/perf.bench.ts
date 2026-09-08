import { afterAll, bench, vi } from "vite-plus/test";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { YMSP, readConfig } from "../src/+.ts";
import os from "node:os";
import path from "node:path";
const directory = process.env.YMSP_CONFIG_DIR ?? path.join(os.homedir(), ".config/ymsp");
const runtime = new YMSP({
  ...readConfig(path.join(directory, "ymsp.config.json")),
  stateFilePath: path.join(directory, "state.json"),
  lockfilePath: path.join(directory, "task.lock"),
  environment: process.env,
});
const defineTask = (callback: () => Promise<void>) => () => runtime.withTaskLock(callback);

// Opt-in: these benchmarks control windows in the active yabai session.
// Vite+ runs benchmarks in Node, so bridge the Bun subprocess API used by the app.
// These measure end-to-end yabai operations, not Bun's process startup performance.
vi.stubGlobal("Bun", {
  spawn(args: string[]) {
    const [command, ...argv] = args;
    if (!command) throw new Error("Missing subprocess command");
    const child = spawn(command, argv, { stdio: ["ignore", "pipe", "inherit"] });
    const exited = new Promise<number>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code) => resolve(code ?? 1));
    });
    // Query call sites consume stdout; command-only call sites consume exited.
    void exited.catch(() => {});
    return { stdout: Readable.toWeb(child.stdout), exited };
  },
});
afterAll(() => vi.unstubAllGlobals());
const { wm, state } = await runtime.withTaskLock(() => runtime.createInitializedWindowsManager());
const window = wm.getFocusedWindow()!;
const stackWindows = wm.getStackWindows();

bench(
  "columnizeStackWindows",
  defineTask(async () => {
    await wm.columnizeStackWindows();
  }),
);
bench(
  "createStack",
  defineTask(async () => {
    await wm.createStack();
  }),
);
bench("doesStackExist", () => {
  wm.doesStackExist();
});
bench(
  "executeYabaiCommand",
  defineTask(async () => {
    await wm.executeYabaiCommand("-m query --windows");
  }),
);
bench("getBottomMasterWindow", () => {
  wm.getBottomMasterWindow();
});
bench("getBottomStackWindow", () => {
  wm.getBottomStackWindow();
});
bench("getBottomWindow", () => {
  wm.getBottomWindow(stackWindows);
});
bench("getDividingLineXCoordinate", () => {
  wm.getDividingLineXCoordinate();
});
bench("getFocusedWindow", () => {
  wm.getFocusedWindow();
});
bench("getMasterWindows", () => {
  wm.getMasterWindows();
});
bench("getMiddleWindows", () => {
  wm.getMiddleWindows();
});
bench("getStackWindows", () => {
  wm.getStackWindows();
});
bench("getTopLeftWindow", () => {
  wm.getTopLeftWindow();
});
bench("getTopMasterWindow", () => {
  wm.getTopMasterWindow();
});
bench("getTopRightWindow", () => {
  wm.getTopRightWindow();
});
bench("getTopStackWindow", () => {
  wm.getTopStackWindow();
});
bench("getTopWindow", () => {
  wm.getTopWindow(stackWindows);
});
bench("getUpdatedWindowData", () => {
  wm.getUpdatedWindowData(window);
});
bench("getWidestMasterWindow", () => {
  wm.getWidestMasterWindow();
});
bench("getWidestStackWindow", () => {
  wm.getWidestStackWindow();
});
bench("getWindowData", () => {
  wm.getWindowData({ windowId: window.id.toString() });
});
bench(
  "initialize",
  defineTask(async () => {
    await wm.initialize();
  }),
);
bench("isBottomWindow", () => {
  wm.isBottomWindow(stackWindows, window);
});
bench("isMasterWindow", () => {
  wm.isMasterWindow(window);
});
bench("isMiddleWindow", () => {
  wm.isMiddleWindow(window);
});
bench("isStackWindow", () => {
  wm.isStackWindow(window);
});
bench("isTopWindow", () => {
  wm.isTopWindow(stackWindows, window);
});
bench(
  "isValidLayout",
  defineTask(async () => {
    await wm.isValidLayout();
  }),
);
bench("isWindowTouchingLeftEdge", () => {
  wm.isWindowTouchingLeftEdge(window);
});
bench(
  "moveWindowToMaster",
  defineTask(async () => {
    await wm.moveWindowToMaster(window);
  }),
);
bench(
  "moveWindowToStack",
  defineTask(async () => {
    await wm.moveWindowToStack(window);
  }),
);
bench(
  "refreshWindowsData",
  defineTask(async () => {
    await wm.refreshWindowsData();
  }),
);
bench(
  "updateWindows",
  defineTask(async () => {
    await wm.updateWindows({ targetNumMasterWindows: 1 });
  }),
);
bench("validateState", () => {
  wm.validateState(state);
});
