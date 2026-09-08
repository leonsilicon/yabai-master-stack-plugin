import { getConfig } from "#utils/config.ts";
import { defineTask } from "#utils/task.ts";
import { createInitializedWindowsManager } from "#utils/windows-manager.ts";
import { queryWindows, usesAerospace } from "#utils/window-manager-backend.ts";
import { withAerospaceWorkspace } from "#utils/aerospace.ts";

export const windowCreated = defineTask(async (windowId?: number) => {
  const envId = usesAerospace() ? process.env.AEROSPACE_WINDOW_ID : process.env.YABAI_WINDOW_ID;
  const id = windowId ?? (envId ? Number(envId) : undefined);
  const windows = await queryWindows();
  // The window ID wins over the process ID; apps can own multiple windows.
  const candidates =
    id !== undefined
      ? windows.filter((w) => w.id === id)
      : windows.filter((w) => !usesAerospace() && w.pid === Number(process.env.YABAI_PROCESS_ID));
  for (const candidate of candidates) {
    if (
      candidate["is-floating"] ||
      candidate["is-hidden"] ||
      candidate["is-minimized"] ||
      candidate["is-native-fullscreen"]
    )
      continue;
    const handle = async () => {
      const { wm } = await createInitializedWindowsManager(candidate.space);
      const window = wm.windowsData.find((w) => w.id === candidate.id);
      if (!window) return; // destroyed, dialog, minimized, hidden or floating
      const count = wm.windowsData.length;
      const max = wm.expectedCurrentNumMasterWindows;
      if (!usesAerospace())
        await wm.executeYabaiCommand(
          `-m config split_type ${count === max ? "vertical" : "horizontal"}`,
        );
      const split = count === max + 1 ? "vertical" : "horizontal";
      const current = wm.windowsData.find((w) => w.id === window.id);
      if (!current) return;
      if (!usesAerospace() && current["split-type"] !== "none" && current["split-type"] !== split) {
        await wm.executeYabaiCommand(`-m window ${window.id} --toggle split`);
      }
      if (getConfig().moveNewWindowsToMaster) {
        await wm.relayoutWindows(wm.windowsData.find((w) => w.id === window.id));
      } else {
        await wm.updateWindows({ targetNumMasterWindows: max });
      }
    };
    if (usesAerospace()) await withAerospaceWorkspace(candidate.space, handle);
    else await handle();
  }
});
