import { AsyncLocalStorage } from "node:async_hooks";
import type { State, YabaiMasterStackPluginConfig } from "#types";
import type { TaskContext } from "./task-context.ts";
import { resolveConfig } from "./config.ts";

export type YMSPSpawn = (
  command: string[],
  options: { stdout: "pipe"; stderr: "pipe"; env: NodeJS.ProcessEnv; signal?: AbortSignal },
) => {
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  exited: Promise<number>;
};

export interface YMSPOptions extends Partial<YabaiMasterStackPluginConfig> {
  /** Omit for instance-local, in-memory state. */
  stateFilePath?: string;
  /** Omit for instance-local task serialization without filesystem locking. */
  lockfilePath?: string;
  /** Opt into cross-process watcher deduplication. */
  watcherLockfilePath?: string;
  /** Environment for subprocesses and window-created signal metadata. Defaults to empty. */
  environment?: NodeJS.ProcessEnv;
  /** Subprocess runner. Defaults to Bun.spawn. */
  spawn?: YMSPSpawn;
  /** Debug output destination. Defaults to stderr; never writes a hidden log file. */
  logger?: (value: unknown) => void;
}

/** Explicit dependencies shared by all operations belonging to one instance. */
export class YMSPRuntime {
  readonly config;
  readonly stateFilePath?: string;
  readonly lockfilePath?: string;
  readonly watcherLockfilePath?: string;
  readonly environment;
  readonly logger;
  readonly spawn;
  readonly taskContext = new AsyncLocalStorage<TaskContext>();
  queue: Promise<unknown> = Promise.resolve();
  state: State = Object.create(null) as State;
  watching = false;

  constructor({
    stateFilePath,
    lockfilePath,
    watcherLockfilePath,
    environment = {},
    logger = console.error,
    spawn = (command, options) => Bun.spawn(command, options),
    ...config
  }: YMSPOptions = {}) {
    this.config = resolveConfig(config);
    this.stateFilePath = stateFilePath;
    this.lockfilePath = lockfilePath;
    this.watcherLockfilePath = watcherLockfilePath;
    this.environment = Object.freeze({ ...environment });
    this.logger = logger;
    this.spawn = spawn;
  }
}
