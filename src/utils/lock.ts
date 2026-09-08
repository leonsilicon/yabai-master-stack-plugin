import { configDirectory } from "./config-directory.ts";
import path from "pathe";

const ymspConfigDirpath = configDirectory;
// A directory owned by proper-lockfile. Keep it separate from the legacy PID file.
export const lockfilePath = path.join(ymspConfigDirpath, "task.lock");

/** All callers must use identical heartbeat/staleness settings. */
export const taskLockOptions = Object.freeze({
  realpath: false,
  stale: 10000,
  update: 2000,
  retries: Object.freeze({
    retries: 600,
    factor: 1,
    minTimeout: 50,
    maxTimeout: 50,
    randomize: false,
  }),
});
