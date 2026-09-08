# Yabai Master-Stack Plugin

Use the same master-stack commands with **yabai or AeroSpace**, selected in your YMSP configuration. Existing configurations continue to use yabai.

[![npm version](https://img.shields.io/npm/v/ymsp)](https://npmjs.com/package/ymsp)

![A video of the Master-Stack plugin in action](./images/yabai-master-stack-plugin-usage.gif)

[Yabai](https://github.com/koekeishiya/yabai) is an amazing tiling manager for macOS. However, since the algorithm Yabai uses is based on bsp (binary-space partitioning), implementing layouts such as the master-stack layout in [dwm](https://dwm.suckless.org/) is [not within their goals for the project](https://github.com/koekeishiya/yabai/issues/658#issuecomment-693687832). Luckily, Yabai provides an incredibly powerful signal system that can execute commands in response to an event in Yabai (e.g. when a window is created, deleted, etc.). This plugin leverages this powerful system to emulate the dwm-style master-stack layout in Yabai.

## Installation

This plugin uses [Bun](https://bun.sh) for faster startup times. To install it, you'll need to first [install Bun](https://bun.sh/docs/installation), and then run the following command:

```bash
bun install --global yabai-master-stack-plugin
```

> To update to a newer version, append `@<version>` at the end of the above install command (e.g. `bun install --global yabai-master-stack-plugin@4.1.0`)

Then, create a configuration file at `~/.config/ymsp/ymsp.config.json` with the following contents (make sure to replace `/usr/local/bin/yabai` with the path of your `yabai` executable; if you're not sure what it is, run `which yabai`):

```json
{
  "yabaiPath": "/usr/local/bin/yabai"
}
```

Then, add the following lines to your `.yabairc`:

```bash
yabai -m config layout bsp

# Labels let you replace these registrations when reloading .yabairc.
for event in window_created window_deminimized; do
  yabai -m signal --remove "ymsp-$event" 2>/dev/null
  yabai -m signal --add label="ymsp-$event" event="$event" action='ymsp window-created'
done
for event in window_destroyed window_minimized application_hidden application_visible space_changed display_added display_removed; do
  yabai -m signal --remove "ymsp-$event" 2>/dev/null
  yabai -m signal --add label="ymsp-$event" event="$event" action='ymsp window-destroyed'
done

ymsp on-yabai-start
```

Hammerspoon and `jq` are not required. Set `yabaiPath` to your installed executable (commonly `/opt/homebrew/bin/yabai` on Apple Silicon). Ensure `ymsp` and Bun are on the PATH used by yabai and your hotkey launcher. Yabai must already be running with its usual Accessibility permissions; commands requiring its scripting addition retain that requirement.

Remove old unlabelled ymsp signal registrations before adopting the labelled configuration. Avoid registering `window_moved` or `window_resized` signals for automatic repair: layout changes can trigger those events themselves. The `window-moved` command remains available for explicit use. `application_launched` can still call `window-created` using `YABAI_PROCESS_ID`, but `window_created` is preferable because it runs when the window exists.

## Configuration

```json
{
  "windowManager": "yabai",
  "yabaiPath": "/opt/homebrew/bin/yabai",
  "masterPosition": "right",
  "moveNewWindowsToMaster": false,
  "resizeIncrement": 50,
  "debug": false
}
```

`masterPosition` accepts `left` or `right`. `resizeIncrement` is a positive pixel amount. When `moveNewWindowsToMaster` is enabled, each created window becomes the top master, even if the existing layout was valid. Floating windows, dialogs, hidden applications, minimized windows, and native fullscreen windows are excluded from tiling.

### AeroSpace

Set `windowManager` to `aerospace` and `aerospacePath` to the output of `which aerospace`:

```json
{
  "windowManager": "aerospace",
  "aerospacePath": "/opt/homebrew/bin/aerospace",
  "masterPosition": "right",
  "moveNewWindowsToMaster": false,
  "resizeIncrement": 50
}
```

Use AeroSpace 0.21.3-Beta with its normal Accessibility permission. Stop yabai and any Spoon layout handlers before starting AeroSpace. No yabai installation, Hammerspoon, or `jq` is needed for this backend. Keep both AeroSpace normalization options enabled and use tile workspaces. Merge the following into your AeroSpace config (do not duplicate existing keys):

```toml
enable-normalization-flatten-containers = true
enable-normalization-opposite-orientation-for-nested-containers = true
default-root-container-layout = 'tiles'
default-root-container-orientation = 'horizontal'
after-startup-command = ['exec-and-forget ymsp watch-aerospace']

[mode.main.binding]
alt-j = 'exec-and-forget ymsp focus-down-window'
alt-k = 'exec-and-forget ymsp focus-up-window'
alt-shift-j = 'exec-and-forget ymsp move-window-down'
alt-shift-k = 'exec-and-forget ymsp move-window-up'
```

Ensure Bun and `ymsp` are on AeroSpace's PATH. Start `ymsp watch-aerospace` once manually when adding this to an already-running AeroSpace session. The watcher repairs creation, removal, minimize/restore, and visibility changes within approximately one second, without reacting to its own resize operations. Duplicate watchers exit cleanly. Restart the watcher after changing YMSP settings; when switching backends, stop it with Ctrl+C or SIGTERM.

Use `ymsp focus-space Work` or `ymsp move-window-to-space Work` for named workspaces. Numeric names such as `1` and `01` stay distinct. AeroSpace master counts are saved in `state.aerospace.json`, separate from yabai's `state.json`, and survive a workspace temporarily disappearing. Workspace transfers may briefly visit the destination to measure its windows before restoring the source. See [AeroSpace behavior and Vitest verification](docs/aerospace.md) for details and known differences.

Master counts are saved per space in `~/.config/ymsp/state.json`, start at one, and survive closing or minimizing windows. Increasing the count beyond the current number of windows reserves capacity for future windows. This preserves the standalone plugin's per-space settings; the Spoon's global `hs.settings` value is not imported.

## Commands

| Command                                                          | Behavior                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `focus-down-window`, `focus-up-window`                           | Traverse masters then stack vertically, wrapping at the ends.                |
| `move-window-down`, `move-window-up`                             | Swap the focused window along that same order.                               |
| `focus-master-window`                                            | Focus the top master.                                                        |
| `move-window-to-master`                                          | Swap the focused tiled window with the top master.                           |
| `increase-master-window-count`, `decrease-master-window-count`   | Change saved master capacity and rebuild the layout.                         |
| `increase-master-width`, `decrease-master-width`                 | Move the shared divider by `resizeIncrement`, from either column.            |
| `increase-window-height`, `decrease-window-height`               | Resize the focused window using its inner vertical edge.                     |
| `close-focused-window`                                           | Close by ID, preserve master occupancy, and choose an adjacent focus target. |
| `minimize-focused-window`                                        | Minimize, repair the layout, and focus an adjacent window.                   |
| `toggle-float-focused-window`                                    | Toggle floating; returning windows are inserted at the top of the stack.     |
| `focus-next-display`, `focus-previous-display`                   | Cycle displays by horizontal position.                                       |
| `move-window-to-next-display`, `move-window-to-previous-display` | Move the focused window and repair affected spaces.                          |
| `focus-space <index>`                                            | Switch to a space and focus its top master.                                  |
| `move-window-to-space <index>`                                   | Move to a space, insert into its stack, and repair both spaces.              |
| `relayout`                                                       | Rebuild the current BSP layout with the focused tiled window as top master.  |
| `window-created [window-id]`                                     | Handle creation using an explicit ID or yabai signal environment.            |
| `window-destroyed`                                               | Repair visible BSP spaces after removal, minimize, or visibility changes.    |
| `window-moved`, `on-yabai-start`                                 | Repair visible BSP spaces.                                                   |

With yabai, space arguments are positive Mission Control indices, not persistent space IDs. Yabai layout rebuilding temporarily floats managed windows and reinserts them as two columns. AeroSpace accepts workspace names and rebuilds native tile containers. Rebuilding can reset manually adjusted proportions. Configured float/stack or accordion spaces are not rebuilt.

For example, if you're using [skhd](https://github.com/koekeishiya/skhd), add the following into your `skhdrc` file:

```text
# focus windows
alt - j : ymsp focus-down-window
alt - k : ymsp focus-up-window

# adjust number of master windows
alt + shift - i : ymsp increase-master-window-count
alt + shift - d : ymsp decrease-master-window-count
```

[Here](https://github.com/leondreamed/macos-configs/blob/main/.config/goku/karabiner.edn#L69) is a real-world example usage of this plugin (using Karabiner + GokuRakuJoudo).

## Troubleshooting

Use `ymsp relayout` to recover a malformed BSP tree. If a command fails, its exit status is nonzero and stderr includes the yabai error. Check that the configured executable exists, yabai is running, and its required permissions are enabled.

CLI tasks serialize through `proper-lockfile` using the directory `~/.config/ymsp/task.lock`. Embedded callers opt into sharing that path with `lockfilePath`. Filesystem locks use the same settings: a heartbeat every 2 seconds, stale recovery after 10 seconds without a heartbeat, and approximately 30 seconds of acquisition retries. Ownership is released on success or failure. If ownership is compromised, the task rejects and its in-flight yabai subprocess is aborted. This is JavaScript-only and can be bundled into Chord without native addons or runtime dependency installation. Do not run the Spoon's layout handlers and this plugin's signals simultaneously.

When upgrading from the PID-file implementation, update the CLI and rebuild/reload every embedded copy (including `chords-ymsp`) together. Older versions use `ymsp.lock` and do not coordinate with the new protocol. The old PID file is no longer used; do not delete an active `task.lock` directory to bypass contention.

## Development

Run `vp install`, then `vp check`, `vp test`, and `vp pack`. Vite+ configures packaging, declaration generation, linting, type checking, formatting, staged hooks, tests, and benchmarks in `vite.config.ts`. `vp run dev` watches package builds.

`src/_ymsp.ts` builds to `dist/_ymsp.mjs`, installed as the `ymsp` command. Bun remains the subprocess runtime. Run `bun dist/_ymsp.mjs --help` to list all 28 tasks, including `watch-aerospace` and the backend-neutral `on-window-manager-start` alias. Existing configuration and state stay in `~/.config/ymsp`; `YMSP_CONFIG_DIR` overrides that directory for isolated sessions and tests. All callers managing the same desktop should use the same directory so they share the task lock.

## Public API

`src/+.ts` builds to `dist/+.mjs` with TypeScript declarations. Construct an instance with explicit settings:

```ts
import { YMSP } from "yabai-master-stack-plugin";

const ymsp = new YMSP({
  windowManager: "aerospace",
  aerospacePath: "/opt/homebrew/bin/aerospace",
  masterPosition: "right",
  resizeIncrement: 50,
});

await ymsp.tasks.focusDownWindow();
await ymsp.tasksMap["focus-space"]("Work");
```

`new YMSP()` uses built-in yabai defaults. Instances never read `ymsp.config.json`, `YMSP_CONFIG_DIR`, or process environment variables. Each instance owns its settings, in-memory master counts, task queue, and lock context. Debugging writes through the optional `logger` callback (stderr by default), without creating a hidden log file. The `environment` option explicitly supplies subprocess environment and `windowCreated` signal metadata; it defaults to an empty object. The optional `spawn` callback supplies a subprocess runner (Bun by default). Prefer passing a window ID directly to `ymsp.tasks.windowCreated(id)`.

Filesystem state and cross-process coordination require explicit paths. For example, a caller choosing to share the CLI's files can supply:

```ts
const ymsp = new YMSP({
  windowManager: "aerospace",
  stateFilePath: "/Users/example/.config/ymsp/state.aerospace.json",
  lockfilePath: "/Users/example/.config/ymsp/task.lock",
  watcherLockfilePath: "/Users/example/.config/ymsp/aerospace-watcher.lock",
});
```

Use the same `lockfilePath` for every instance or process managing the same desktop. Without that option, serialization is local to the instance. `stateFilePath` is used exactly as provided; choose separate files for different backends. `watcherLockfilePath` enables cross-process watcher deduplication; without it, duplicate watchers are suppressed within the instance only. To opt into file configuration, spread `readConfig(explicitConfigPath)` into the constructor options; it has no implicit path or cache. The CLI itself explicitly selects the conventional paths and environment, preserving its existing behavior.

Importing the API does not run the CLI or execute a task. Instance tasks acquire their configured lock automatically. Callers using mutating manager methods should await them inside the instance's `withTaskLock` callback:

```ts
await ymsp.withTaskLock(async () => {
  const { wm } = await ymsp.createInitializedWindowsManager();
  await wm.relayoutWindows();
  await ymsp.tasks.focusMasterWindow();
});
```

Nested tasks reuse the same instance's ownership. Always await work before returning from the callback. Settings stay attached to returned window managers. Standalone manager methods require a manager as their `this` value (for example `getMasterWindows.call(wm)`). `moveWindowToMaster` is the task; `moveManagedWindowToMaster` is the manager method. All manager methods remain exported as `windowsManagerMethods`.

**API migration:** unbound task, configuration, state, display, space, and backend helpers now require a `YMSPRuntime` as their first argument. `YMSP` extends that runtime, so existing imports can be migrated as follows:

```ts
import { focusDownWindow, queryWindows, withTaskLock } from "yabai-master-stack-plugin";

await focusDownWindow(ymsp);
console.log(await queryWindows(ymsp));
await withTaskLock(ymsp, async () => {
  await focusDownWindow(ymsp);
});
```

`defineTask` callbacks also receive the runtime first, and the returned task requires it. Constructing a `WindowsManager` directly requires a `runtime` option. The unbound `tasksMap` registry follows the same explicit-runtime signature; `ymsp.tasksMap` and `ymsp.tasks` are already bound to their instance. No API helper falls back to a global instance.

`vp run bench` runs the ported performance suite through Vite+. It requires a configured, running yabai session and moves real windows; it is separate from the mocked unit tests. The benchmark runner bridges Bun subprocess calls to Node child processes, so results measure end-to-end yabai operations rather than Bun startup performance.

The [port audit](docs/master-stack-port.md) maps the Spoon behavior to this implementation and records intentional differences. `vp test` uses mocked window data and isolated temporary files; it does not move your desktop windows.

The opt-in [AeroSpace live Vitest suite](docs/aerospace.md#automated-tests) tests real windows against AeroSpace 0.21.3-Beta. Public `queryWindows`, `queryFocusedWindow`, display/space helpers, and tasks honor the selected backend. The low-level `runYabai`/`runYabaiCommand` exports always invoke yabai; `runAerospace` always invokes AeroSpace. The legacy `executeYabaiCommand` manager method routes its supported internal operations to the selected backend.
