# Yabai Master-Stack-Layout Plugin

[Yabai](https://github.com/koekeishiya/yabai) is an amazing tiling manager for macOS. However, since Yabai uses the is based on bsp (binary-space partitioning), implementing layouts such as the master-stack layout in [dwm](https://dwm.suckless.org/) is not within their goals for the project. Luckily, Yabai provides an incredibly powerful signal system that can execute commands in response to an event in Yabai (e.g. when a window is created, deleted, etc.). This plugin leverages this powerful system to emulate the dwm-style master-stack layout in Yabai.

To "install" this plugin, make sure you have [Node](https://nodejs.org/en/) installed, and then clone this Git repository into a folder:
```bash
git clone
```
add the following lines to your `.yabairc`:

```bash
yabai -m signal --add event=window_created action='node ~/scripts/yabai/dist/handlers/window-created.js'

yabai -m signal --add event=application_launched action='node ~/scripts/yabai/dist/handlers/window-created.js'

yabai -m signal --add event=window_moved action='node ~/scripts/yabai/dist/handlers/window-moved.js'

node ~/scripts/yabai/dist/handlers/on-yabai-start.js
```