# Yabai Master-Stack Plugin

![A screenshot of the Master-Stack plugin in action](/images/yabai-master-stack-plugin-screenshot.png)

[Yabai](https://github.com/koekeishiya/yabai) is an amazing tiling manager for macOS. However, since the algorithm Yabai uses is based on bsp (binary-space partitioning), implementing layouts such as the master-stack layout in [dwm](https://dwm.suckless.org/) is [not within their goals for the project](https://github.com/koekeishiya/yabai/issues/658#issuecomment-693687832). Luckily, Yabai provides an incredibly powerful signal system that can execute commands in response to an event in Yabai (e.g. when a window is created, deleted, etc.). This plugin leverages this powerful system to emulate the dwm-style master-stack layout in Yabai.

## Installation

To "install" this plugin, make sure you have [Node.js](https://nodejs.org) installed. Then, run the following command to install the npm package globally:

```bash
npm install --global yabai-master-stack-plugin
```

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

yabai -m signal --add event=window_moved action='ymsp window-moved'

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
alt + j : ymsp focus-down-window
alt + k : ymsp focus-up-window

# adjust number of master windows
alt + shift - i : ymsp increase-master-window-count
alt + shift - d : ymsp decrease-master-window-count
```

[Here](https://github.com/leonzalion/macos-configs/blob/main/.config/goku/karabiner.edn#L69) is a real-world example usage of this plugin (using Karabiner + GokuRakuJoudo).

## Troubleshooting

So there's this super obscure error when binding shell commands to Karabiner where the Node processes will abruptly exit without the onExit callback getting called when registered using the `signal-exit` package (which ends up causing a deadlock since the lockfile doesn't get released). To fix this error, you need to add a `> /dev/null` to the end of the node command in the karabiner `shell_command` property [(see this commit)](https://github.com/leonzalion/macos-configs/commit/6df4fb7e6677e1e9bc1aebc2ccaa37df939c4688#diff-dff9f478ed6c5e11907650c8803d50aaf8d3603be5485c71792f5e34065be4aa). I have absolutely no idea why this works, but I discovered it on accident when trying to debug the command by redirecting stdout to a file and then failing to reproduce the issue afterwards.

Maybe I'll add some kind of synchronization mechanism in the future where the plugin will check whether the process which registered the lock is still active, and if it's not active, then it'll delete the lock file or something.

## TODO

[ ] Add an option to temporary disable auto-positioning of a window.
