import type { YMSPRuntime } from "#utils/runtime.ts";
import { getTaskSignal } from "./task-context.ts";

export interface DesktopGeometry {
  displays: { id: number; x: number; y: number; w: number; h: number }[];
  windows: { id: number; frame: { X: number; Y: number; Width: number; Height: number } }[];
}

// AeroSpace's stable CLI does not expose frames. Read WindowServer geometry
// through the built-in JXA bridge; no yabai, Hammerspoon, or native addon needed.
const script = `
ObjC.import('AppKit');
ObjC.import('CoreGraphics');
const windows = ObjC.deepUnwrap(ObjC.castRefToObject($.CGWindowListCopyWindowInfo(0, 0)));
const screens = $.NSScreen.screens;
const height = screens.objectAtIndex(0).frame.size.height;
const displays = [];
for (let i = 0; i < screens.count; i++) {
  const f = screens.objectAtIndex(i).frame;
  displays.push({id:i+1, x:f.origin.x, y:height-f.origin.y-f.size.height, w:f.size.width, h:f.size.height});
}
JSON.stringify({displays, windows:windows.map(w => ({id:w.kCGWindowNumber, frame:w.kCGWindowBounds}))});
`;

export async function getDesktopGeometry(runtime: YMSPRuntime): Promise<DesktopGeometry> {
  const signal = getTaskSignal(runtime);
  const child = runtime.spawn(["/usr/bin/osascript", "-l", "JavaScript", "-e", script], {
    env: runtime.environment,
    stdout: "pipe",
    stderr: "pipe",
    ...(signal ? { signal } : {}),
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  getTaskSignal(runtime);
  if (code !== 0) throw new Error(`Cannot read macOS window geometry: ${stderr || stdout}`);
  return JSON.parse(stdout) as DesktopGeometry;
}
