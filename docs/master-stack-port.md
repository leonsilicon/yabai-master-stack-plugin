# MasterStackLayout port audit

Source: `Spoons/Spoons/MasterStackLayout.spoon/src`, reviewed 2026-09-08. TypeScript is the source of truth; `mod.generated.lua` is compiled output and `init.lua` only loads it.

| Source area                                                                                | Standalone implementation                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mod.ts`, `utils/setting.ts`                                                               | JSON config, validated pixel increment, persisted per-space master capacity. No `hs.settings`, notifications, or Spoon lifecycle.                                                     |
| `classes/window.ts`                                                                        | Manager snapshots refreshed after commands; separate authoritative focused-window query; all windows available for close/minimize/float, tiled subset excludes dialogs.               |
| `classes/space.ts`, `classes/display.ts`                                                   | Fresh yabai queries; resolve space indices separately from persistent IDs and display indices. Explicit destination managers for moves/events.                                        |
| `utils/dividing-line.ts`, `master-windows.ts`, `stack-windows.ts`, `positional-windows.ts` | Simpler geometry based on the actual left edge and top-right window. Top/bottom/widest helpers remain public.                                                                         |
| `utils/layout.ts`, `methods/relayout.ts`                                                   | Rebuild by temporarily floating other windows, inserting the first stack beside the chosen master, then inserting each column southward. Recover temporary floats on command failure. |
| `methods/increase/decrease-master-window-count.ts`                                         | Preserve preferred capacity independently of available windows; rebuild around the existing top master.                                                                               |
| `methods/handle-window-created.ts`                                                         | Adjust default split and the created window's split at master-capacity transitions. Resolve signal window's actual space. Honor the standalone new-master preference.                 |
| `methods/handle-window-destroyed.ts`                                                       | Validate and repair visible BSP spaces, including nonfocused monitors. Used by startup/moved aliases too.                                                                             |
| Focus/move up/down methods                                                                 | Ordered master/stack traversal, wraparound, and missing-focus fallback. Direct target IDs replace directional commands and unreachable fallback branches.                             |
| Focus/move master methods                                                                  | Select top master explicitly by ID.                                                                                                                                                   |
| Width/height methods                                                                       | Configurable pixel resizing with edge selected from column membership and vertical position.                                                                                          |
| Close/minimize methods                                                                     | Close the captured ID, swap a sole master before closing, promote a bottom stack window into a depleted multi-master column, and select source-style adjacent focus targets.          |
| Toggle float                                                                               | Reinsert above the top stack and repair after toggling.                                                                                                                               |
| Display/space methods                                                                      | Cycle displays in coordinate order, move by explicit ID, insert into destination stack, repair source/destination, and focus top master after switching spaces.                       |
| `utils/yabai.ts`, `utils/window.ts`                                                        | Bun argument-array subprocesses, checked status/stderr, typed errors and idempotent float changes. No shell interpolation, jq, or Hammerspoon.                                        |
| `lib/*`                                                                                    | Standard promises/arrays and existing invariant package replace Lua compatibility helpers.                                                                                            |

## Intentional differences and corrections

- Keep the standalone default master position (`right`) and its per-space state format. The Spoon default is `left` and its master count is global. No Hammerspoon state is required or automatically migrated.
- Clamp the effective master count to available windows without lowering the saved preference. Fix the source validity check's inverted all-windows condition and detect nested third columns by checking both column edges.
- Use actual window edges, including padding and negative display origins, rather than treating x=0 as a universal boundary. Single-column windows cannot also count as stack windows.
- Increasing master width grows the master for both positions. The Spoon's left-master implementation applies the opposite sign.
- Focus and swap wrap within a single column as well as two columns; absent focus selects the top/bottom master. Swapping to master targets its top window rather than an arbitrary east/west neighbor.
- Creation events ignore stale IDs and non-tiled windows, prefer window ID over process ID, and honor `moveNewWindowsToMaster` even for an already valid layout. The Spoon exposes that option but does not use it in its creation handler.
- Inactive destination spaces retain their non-minimized tiled windows in queries, even when yabai marks them not visible. Float/native fullscreen spaces are not rebuilt.
- The source's `getHasFocus` warning is honored: query `--windows --window` instead of trusting `has-focus`. Socket failures propagate; an explicit no-window response is a no-op.
- Preserve preferred counts, fix stale space-ID cleanup, and write state through an atomic rename.
- Serialize complete tasks instead of allowing a new process to steal ownership during a rebuild. All task errors reject through the API and produce a failing CLI exit status.
- The Spoon's partial `utils/aerospace.ts` wrappers are not a working alternate backend: its window/space/display classes and most methods still call yabai, and several wrappers use yabai-style commands. This package remains a yabai plugin and does not claim AeroSpace support.

## Validation

`vp check`, `vp test`, and `vp run build` validate formatting, lint, types, public exports, command behavior, geometry, state, subprocess error handling, and ownership serialization. CLI help and invalid-argument checks use the built artifact. Real desktop performance benchmarks remain opt-in because they move windows. Live yabai visual behavior has not been exercised during this port.
