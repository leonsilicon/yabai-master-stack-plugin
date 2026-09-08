#!/usr/bin/env bun
import { tasksMap, type TaskName } from "./tasks-map.ts";
import { Argument, program } from "commander";

program
  .name("ymsp")
  .showHelpAfterError()
  .addArgument(new Argument("<task>", "Task to run").choices(Object.keys(tasksMap)))
  .argument("[index]", "Space index, or optional window ID for window-created")
  .action(async (slug: TaskName, value?: string) => {
    const needsIndex = slug === "focus-space" || slug === "move-window-to-space";
    if (needsIndex && value === undefined) throw new Error(`${slug} requires a space index`);
    if (value !== undefined && !needsIndex && slug !== "window-created")
      throw new Error(`${slug} takes no argument`);
    const index = value === undefined ? undefined : Number(value);
    if (index !== undefined && (!Number.isInteger(index) || index < 1))
      throw new Error("Index must be a positive integer");
    if (needsIndex) await tasksMap[slug](index!);
    else if (slug === "window-created") await tasksMap[slug](index);
    else await tasksMap[slug]();
  });
try {
  await program.parseAsync(process.argv);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
