import type { YMSPRuntime } from "./runtime.ts";

export function debug(runtime: YMSPRuntime, cb: () => unknown) {
  if (runtime.config.debug) runtime.logger(cb());
}
