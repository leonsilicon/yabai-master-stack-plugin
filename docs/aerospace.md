# AeroSpace backend and verification

YMSP supports AeroSpace **0.21.3-Beta** (`d56e1637c3a1ed660d0cadd7534e94fb3218d1c3`), the latest release checked on September 8, 2026. See the [upstream release](https://github.com/nikitabobko/AeroSpace/releases/tag/v0.21.3-Beta) and [CLI documentation](https://nikitabobko.github.io/AeroSpace/commands).

## Behavior reference

The behavioral reference is `MasterStackLayout.spoon/src/methods` and `src/utils` in the user's Spoons checkout. The existing [port audit](master-stack-port.md) describes the shared command behavior. The Spoon's `src/utils/aerospace.ts` contains yabai-shaped commands such as `query windows` and `window ... warp`; these are not supported by upstream AeroSpace 0.21.3. This backend uses upstream commands instead.

| Behavior                                                      | AeroSpace implementation                                                                                                                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Master on left or right; multiple vertically arranged masters | Native horizontal root with vertical tile containers, or a single vertical column when all windows are masters                                      |
| Master/stack traversal and wrapping                           | Shared geometry-based order; focus by window ID                                                                                                     |
| Swap with an arbitrary window                                 | Adjacent DFS swaps implementing an exact transposition, preserving unrelated slots and proportions                                                  |
| Rebuild around chosen master                                  | Flatten and arrange native containers, preserving requested column membership and vertical order; restore focus on success or failure               |
| Master width                                                  | Resize the shared ancestor horizontally; direction is correct from either column                                                                    |
| Window height                                                 | Two opposing native resizes affect the focused window and its inner neighbor; other siblings retain their heights, with up to one pixel of rounding |
| Toggle float; move into another workspace                     | Capture columns before AeroSpace changes the intermediate tree; insert returning/moved windows at the top of the stack                              |
| Close and minimize                                            | Native commands by ID, then shared occupancy and focus repair                                                                                       |
| Native lifecycle changes                                      | A watcher compares membership, visibility, and relative columns every second, including hide/unhide cycles that finish between polls                |
| Display cycling                                               | Read native display coordinates and map NSScreen identity to AeroSpace monitor IDs                                                                  |
| Saved master capacity                                         | Separate `state.aerospace.json`, keyed by exact workspace name; retain counts for temporarily absent workspaces                                     |

AeroSpace workspaces are named virtual workspaces, not Mission Control spaces. Commands accept names such as `Work`, `1`, or `01` without conflating them. Yabai still requires positive Mission Control indices.

AeroSpace's stable queries do not expose window frames. A small script run by macOS's built-in `osascript` reads WindowServer geometry through AppKit/CoreGraphics. This requires neither yabai nor Hammerspoon, native addons, nor a compiler at runtime. AeroSpace itself requires Accessibility permission. Public window queries report actual native frames; inactive AeroSpace windows are parked offscreen. Geometry-dependent workspace transfers temporarily visit the destination and restore the source workspace, so a workspace switch can be visible. Rebuilding resets manually adjusted proportions. Accordion workspaces and floating windows are not rebuilt. Layout repair pauses while an AeroSpace fullscreen window occupies the workspace and resumes when fullscreen ends.

## Automated tests

All tests use **Vitest through Vite+**. `vp test` runs isolated unit/regression tests and skips desktop integration by default. The tests cover backend selection and compatibility, actual AeroSpace output fields, Unicode names/titles, monitor mapping, error propagation, insertion recovery, all 36 pairwise swaps for six windows, resizing, state separation, and legacy yabai behavior.

`tests/aerospace.live.test.ts` runs the real Bun CLI against AeroSpace. It creates six disposable native macOS windows for each scenario and asserts their real positions, dimensions, membership, and focus. Both master orientations are tested. Tests cover count changes beyond capacity, focus/swap wraparound, width and adjacent-height deltas, float reinsertion, named workspace transfers, close/minimize focus, creation callbacks, watcher restoration/hide/unhide, empty workspaces, and accordion protection. Physical display transfer tests skip explicitly when only one monitor is connected.

To run the desktop suite:

1. Stop other tiling managers and quit any existing AeroSpace instance. Use a test desktop/session; the suite moves real windows.
2. Launch AeroSpace with the isolated config (existing personal windows are floated, while the tests explicitly tile their own fixtures):

   ```sh
   /Applications/AeroSpace.app/Contents/MacOS/AeroSpace --config-path "$PWD/tests/fixtures/aerospace.toml"
   ```

3. In another terminal, run:

   ```sh
   YMSP_AEROSPACE_LIVE=1 \
   YMSP_AEROSPACE_LIVE_CONFIG="$PWD/tests/fixtures/aerospace.toml" \
   vp run test:aerospace
   ```

The suite verifies the server config path and exact client/server version before testing. Set `YMSP_AEROSPACE_PATH` if the CLI is elsewhere. Xcode Command Line Tools are needed only to compile the disposable Swift test app. The tests use a temporary `YMSP_CONFIG_DIR`, terminate their fixture app/watcher, and restore the original workspace/focus afterward. Quit the test AeroSpace instance and restart your usual window manager afterward.

## Validation record — September 8, 2026

- `vp check`: formatting, linting, and type checking passed.
- `vp test`: **126 unit/regression tests passed**; the desktop suite was skipped by default.
- Opt-in live Vitest run: **26 passed, 2 skipped**, using AeroSpace CLI and server **0.21.3-Beta**, commit `d56e1637c3a1ed660d0cadd7534e94fb3218d1c3`. Both physical-monitor transfer cases were skipped because only one monitor was connected. Monitor identity/coordinate mapping and command routing were tested with unit fixtures.
- `vp run build`: passed, including declaration generation; built CLI help and API exports were checked.

The live tests caught and verified fixes for focus restoration after workspace moves, preservation of the right master during float/workspace insertion, and missed rapid hide/unhide transitions. The test AeroSpace instance and fixture windows were stopped afterward, and the previously running yabai process was resumed.
