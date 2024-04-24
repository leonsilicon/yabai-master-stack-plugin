#!/usr/bin/env bun

import * as tasks from '#tasks/_.ts';
import { Argument, program } from 'commander';
import process from 'node:process';

const tasksMap = {
	'close-focused-window': tasks.closeFocusedWindow,
	'decrease-master-window-count': tasks.decreaseMasterWindowCount,
	'focus-down-window': tasks.focusDownWindow,
	'focus-up-window': tasks.focusUpWindow,
	'increase-master-window-count': tasks.increaseMasterWindowCount,
	'on-yabai-start': tasks.onYabaiStart,
	'window-created': tasks.windowCreated,
	'window-moved': tasks.windowMoved,
	'focus-next-display': tasks.focusNextDisplay,
	'focus-previous-display': tasks.focusPreviousDisplay,
	'move-window-to-next-display': tasks.moveWindowToNextDisplay,
	'move-window-to-previous-display': tasks.moveWindowToPreviousDisplay,
};

program
	.name('ymsp')
	.showHelpAfterError()
	.addArgument(
		new Argument('<task>').choices(Object.keys(tasksMap)),
	)
	.action(async (taskSlug: string) => {
		const task = tasksMap[taskSlug];
		if (!task) {
			console.error(`Task "${taskSlug}" not found`);
			process.exit(1);
		}

		await task();
		process.exit(0);
	});

program.parse(process.argv);
