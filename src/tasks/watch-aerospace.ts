import { setTimeout } from "node:timers/promises";
import fs from "node:fs";
import path from "pathe";
import lockfile from "proper-lockfile";
import { configDirectory } from "#utils/config-directory.ts";
import { queryAerospaceWindows, getAerospaceSpaces } from "#utils/aerospace.ts";
import { usesAerospace } from "#utils/window-manager-backend.ts";
import { withTaskLock } from "#utils/task.ts";
import { windowCreated } from "./window-created.ts";
import { windowDestroyed } from "./window-destroyed.ts";

/** AeroSpace 0.21 has no destruction/minimize/hide subscription events.
 * Reconcile membership and column structure once a second. Ignore absolute
 * dimensions and focus so manual resizing cannot create a repair loop. */
export async function watchAerospace(signal?: AbortSignal): Promise<void> {
  if (!usesAerospace()) throw new Error("watch-aerospace requires windowManager: aerospace");
  fs.mkdirSync(configDirectory, { recursive: true });
  const lockPath = path.join(configDirectory, "aerospace-watcher.lock");
  let release: () => Promise<void>;
  try {
    release = await lockfile.lock(lockPath, {
      realpath: false,
      lockfilePath: lockPath,
      retries: 0,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ELOCKED") return;
    throw error;
  }
  let previous = "";
  let known = new Set<number>();
  try {
    while (!signal?.aborted) {
      await withTaskLock(async () => {
        const windows = await queryAerospaceWindows();
        const spaces = await getAerospaceSpaces();
        const columnBySpace = new Map(
          spaces.map((space) => [
            space.index,
            [
              ...new Set(
                windows
                  .filter(
                    (w) =>
                      w.space === space.index &&
                      !w["is-floating"] &&
                      !w["is-hidden"] &&
                      !w["is-native-fullscreen"],
                  )
                  .map((w) => w.frame.x),
              ),
            ].sort((a, b) => a - b),
          ]),
        );
        const signature = JSON.stringify([
          windows
            .map((w) => [
              w.id,
              w.space,
              w["is-floating"],
              w["is-hidden"],
              w["is-native-fullscreen"],
              // Hide/unhide can finish between polls with identical IDs but
              // a different tree. Relative columns detect that without
              // treating changes in divider position as structural changes.
              columnBySpace.get(w.space)?.indexOf(w.frame.x) ?? -1,
            ])
            .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
          spaces
            .map((s) => [s.index, s.display, s["is-visible"], s.type])
            .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
        ]);
        if (signature === previous) return;
        if (previous) {
          for (const window of windows) {
            if (!known.has(window.id) && window["is-visible"]) await windowCreated(window.id);
          }
        }
        await windowDestroyed();
        known = new Set(windows.map((w) => w.id));
        previous = signature;
      });
      try {
        await setTimeout(1000, undefined, signal ? { signal } : {});
      } catch (error) {
        if (!signal?.aborted) throw error;
      }
    }
  } finally {
    await release();
  }
}
