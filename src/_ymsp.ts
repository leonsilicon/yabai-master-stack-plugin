#!/usr/bin/env bun

import { tasksMap, type TaskName } from "./tasks-map.ts";
import { Argument, program } from "commander";
import process from "node:process";

program
  .name("ymsp")
  .showHelpAfterError()
  .addArgument(new Argument("<task>", "Task to run").choices(Object.keys(tasksMap)))
  .action(async (taskSlug: string) => {
    const task = tasksMap[taskSlug as TaskName];
    if (!task) {
      console.error(`Task "${taskSlug}" not found`);
      process.exit(1);
    }

    await task();
    process.exit(0);
  });

await program.parseAsync(process.argv);
