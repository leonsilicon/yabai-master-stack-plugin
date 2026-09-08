#!/usr/bin/env bun
import { usesAerospace } from "./utils/window-manager-backend.ts";
import { tasksMap, type TaskName } from "./tasks-map.ts";
import { Argument, program } from "commander";

program
  .name("ymsp")
  .showHelpAfterError()
  .addArgument(new Argument("<task>", "Task to run").choices(Object.keys(tasksMap)))
  .argument("[target]", "Space index/workspace name, or optional window ID for window-created")
  .action(async (slug: TaskName, value?: string) => {
    const needsIndex = slug === "focus-space" || slug === "move-window-to-space";
    if (needsIndex && value === undefined) throw new Error(`${slug} requires a space index`);
    if (value !== undefined && !needsIndex && slug !== "window-created")
      throw new Error(`${slug} takes no argument`);
    const index = value === undefined ? undefined : Number(value);
    if (
      !(needsIndex && usesAerospace()) &&
      index !== undefined &&
      (!Number.isInteger(index) || index < 1)
    )
      throw new Error("Index must be a positive integer");
    if (needsIndex) await tasksMap[slug](usesAerospace() ? value! : index!);
    else if (slug === "window-created") await tasksMap[slug](index);
    else if (slug === "watch-aerospace") {
      const controller = new AbortController();
      const stop = () => controller.abort();
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
      try {
        await tasksMap[slug](controller.signal);
      } finally {
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
      }
    } else await tasksMap[slug]();
  });
try {
  await program.parseAsync(process.argv);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
