# Yabai Master-Stack Plugin

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
  "yabaiPath": "/opt/homebrew/bin/yabai",
  "masterPosition": "right",
  "moveNewWindowsToMaster": false,
  "resizeIncrement": 50,
  "debug": false
}
```

`masterPosition` accepts `left` or `right`. `resizeIncrement` is a positive pixel amount. When `moveNewWindowsToMaster` is enabled, each created window becomes the top master, even if the existing layout was valid. Floating windows, dialogs, hidden applications, minimized windows, and native fullscreen windows are excluded from tiling.

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

Space arguments are positive Mission Control indices, not yabai's persistent space IDs. Layout rebuilding temporarily floats managed windows and reinserts them as two columns. It can reset manually adjusted proportions. Configured float/stack spaces are not rebuilt.

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

Tasks serialize using `~/.config/ymsp/ymsp.lock`, release ownership on success or failure, and wait up to 30 seconds for another task. A dead owner's lock is recovered. Do not run the Spoon's layout handlers and this plugin's signals simultaneously.

## Development

Run `vp install`, then `vp check`, `vp test`, and `vp pack`. Vite+ configures packaging, declaration generation, linting, type checking, formatting, staged hooks, tests, and benchmarks in `vite.config.ts`. `vp run dev` watches package builds.

`src/_ymsp.ts` builds to `dist/_ymsp.mjs`, installed as the `ymsp` command. Bun remains the runtime for yabai subprocesses. Run `bun dist/_ymsp.mjs --help` to list all 26 tasks. Existing configuration and state stay in `~/.config/ymsp`.

## Public API

`src/+.ts` builds to `dist/+.mjs` with TypeScript declarations. Import tasks, config/state/display/space helpers, yabai types, `WindowsManager`, and all manager methods from `yabai-master-stack-plugin`:

```ts
import { focusDownWindow, createInitializedWindowsManager } from "yabai-master-stack-plugin";

await focusDownWindow();
const { wm } = await createInitializedWindowsManager();
console.log(wm.getMasterWindows());
```

Importing the API does not run the CLI or execute a task. Tasks acquire the process ownership lock; callers using mutating manager methods directly should run them inside `defineTask`. Standalone manager methods require a manager as their `this` value (for example `getMasterWindows.call(wm)`). `moveWindowToMaster` is the task; `moveManagedWindowToMaster` is the manager method. All manager methods are also exported as `windowsManagerMethods`. `tasksMap` and `TaskName` expose the CLI task registry.

`vp run bench` runs the ported performance suite through Vite+. It requires a configured, running yabai session and moves real windows; it is separate from the mocked unit tests. The benchmark runner bridges Bun subprocess calls to Node child processes, so results measure end-to-end yabai operations rather than Bun startup performance.

The [port audit](docs/master-stack-port.md) maps the Spoon behavior to this implementation and records intentional differences. `vp test` uses mocked window data and isolated temporary files; it does not move your desktop windows.
