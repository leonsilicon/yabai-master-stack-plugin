import { YMSPRuntime, type YMSPOptions } from "./utils/runtime.ts";
import * as tasks from "./tasks/_.ts";
import { tasksMap } from "./tasks-map.ts";
import { withTaskLock } from "./utils/task.ts";
import { createInitializedWindowsManager } from "./utils/windows-manager.ts";

type BoundTasks<T> = {
  readonly [K in keyof T]: T[K] extends (runtime: YMSPRuntime, ...args: infer A) => infer R
    ? (...args: A) => R
    : never;
};

function bindTasks<T extends Record<string, (runtime: YMSPRuntime, ...args: never[]) => unknown>>(
  runtime: YMSPRuntime,
  registry: T,
): BoundTasks<T> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(registry).map(([name, task]) => [name, task.bind(null, runtime)]),
    ),
  ) as BoundTasks<T>;
}

/** An embedded YMSP instance with explicit settings and optional shared persistence. */
export class YMSP extends YMSPRuntime {
  readonly tasks;
  readonly tasksMap;

  constructor(options: YMSPOptions = {}) {
    super(options);
    this.tasks = bindTasks(this, tasks);
    this.tasksMap = bindTasks(this, tasksMap);
  }

  withTaskLock<T>(callback: () => Promise<T>): Promise<T> {
    return withTaskLock(this, callback);
  }

  createInitializedWindowsManager(spaceIndex?: number | string) {
    return createInitializedWindowsManager(this, spaceIndex);
  }
}
