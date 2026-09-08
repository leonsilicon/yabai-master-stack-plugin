# Yabai Master-Stack Plugin

[![npm version](https://img.shields.io/npm/v/ymsp)](https://npmjs.com/package/ymsp)

![A video of the Master-Stack plugin in action](./images/yabai-master-stack-plugin-usage.gif)

[Yabai](https://github.com/koekeishiya/yabai) is an amazing tiling manager for macOS. However, since the algorithm Yabai uses is based on bsp (binary-space partitioning), implementing layouts such as the master-stack layout in [dwm](https://dwm.suckless.org/) is [not within their goals for the project](https://github.com/koekeishiya/yabai/issues/658#issuecomment-693687832). Luckily, Yabai provides an incredibly powerful signal system that can execute commands in response to an event in Yabai (e.g. when a window is created, deleted, etc.). This plugin leverages this powerful system to emulate the dwm-style master-stack layout in Yabai.

## Installation

This plugin uses [Bun](https://bun.sh) for faster startup times. To install it, you'll need to first [install Bun](https://bun.sh/docs/installation), and then run the following command:

```bash
bun install --global ymsp
```

> To update to a newer version, append `@<version>` at the end of the above install command (e.g. `bun install --global ymsp@4.1.0`)

Then, create a configuration file at `~/.config/ymsp/ymsp.config.json` with the following contents (make sure to replace `/usr/local/bin/yabai` with the path of your `yabai` executable; if you're not sure what it is, run `which yabai`):

```json
{
  "yabaiPath": "/usr/local/bin/yabai"
}
```

Then, add the following lines to your `.yabairc`:

```bash
yabai -m signal --add event=window_created action='ymsp window-created'
yabai -m signal --add event=application_launched action='ymsp window-created'

ymsp on-yabai-start
```

Then, to make the actions of focusing on the next/prev window work smoothly, set the keybinds to execute the `ymsp` command and pass the appropriate task as the second argument. The list of possible tasks are:

`close-focused-window`: Quits the currently focused window by Yabai.
\
`decrease-master-window-count`: Decreases the number of master windows.
\
`focus-down-window`: Focuses on the window below the currently focused window.
\
`focus-up-window`: Focuses on the window above the currently focused window.
\
`increase-master-window-count`: Increases the number of master windows.

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

When binding shell commands to Karabiner, Node.js processes will abruptly exit without the exit handlers getting called to release a lockfile. This error can be fixed by adding a `> /dev/null` to the end of the node command in the karabiner `shell_command` property [(see this commit)](https://github.com/leondreamed/macos-configs/commit/6df4fb7e6677e1e9bc1aebc2ccaa37df939c4688#diff-dff9f478ed6c5e11907650c8803d50aaf8d3603be5485c71792f5e34065be4aa).

If you have any other issues with this plugin, please don't hesitate to open an New Issue under the Issues tab!

## TODO

- [ ] Add an option to temporary disable auto-positioning of a window.

## Development

Run `vp install`, then `vp check`, `vp test`, and `vp pack`. Vite+ configures packaging, declaration generation, linting, type checking, formatting, staged hooks, tests, and benchmarks in `vite.config.ts`. `vp run dev` watches package builds.

`src/_ymsp.ts` builds to `dist/_ymsp.mjs`, installed as the `ymsp` command. Bun remains the runtime for yabai subprocesses. Run `bun dist/_ymsp.mjs --help` to list all 14 tasks. Existing configuration and state stay in `~/.config/ymsp`.

## Public API

`src/+.ts` builds to `dist/+.mjs` with TypeScript declarations. Import tasks, config/state/display/space helpers, yabai types, `WindowsManager`, and all manager methods from `ymsp`:

```ts
import { focusDownWindow, createInitializedWindowsManager } from "ymsp";

await focusDownWindow();
const { wm } = await createInitializedWindowsManager();
console.log(wm.getMasterWindows());
```

Importing the API does not run the CLI or execute a task. Tasks acquire the process ownership lock; callers using mutating manager methods directly should run them inside `defineTask`. Standalone manager methods require a manager as their `this` value (for example `getMasterWindows.call(wm)`). `moveWindowToMaster` is the task; `moveManagedWindowToMaster` is the manager method. All manager methods are also exported as `windowsManagerMethods`. `tasksMap` and `TaskName` expose the CLI task registry.

`vp run bench` runs the ported performance suite through Vite+. It requires a configured, running yabai session and moves real windows; it is separate from the mocked unit tests. The benchmark runner bridges Bun subprocess calls to Node child processes, so results measure end-to-end yabai operations rather than Bun startup performance.
