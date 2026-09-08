import type { YMSPRuntime } from "#utils/runtime.ts";
import { usesAerospace } from "./window-manager-backend.ts";
export function workspaceTarget(runtime: YMSPRuntime, value: number | string): number | string {
  if (usesAerospace(runtime)) {
    const name = String(value);
    if (!name.trim() || /[\0\r\n]/.test(name))
      throw new Error("Workspace name must be nonempty and contain no control characters");
    return name;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1)
    throw new Error("Space index must be a positive integer");
  return value;
}
