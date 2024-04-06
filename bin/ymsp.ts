#!/usr/bin/env bun

import * as tasks from '#tasks/_.ts';
import { releaseHandlerLock } from '#utils/lock.ts';
import { Argument, program } from 'commander';
import process from 'node:process';
import { onExit } from 'signal-exit';

const tasksMap = {
	'close-focused-window': tasks.closeFocusedWindow,
	'decrease-master-window-count': tasks.decreaseMasterWindowCount,
	'focus-down-window': tasks.focusDownWindow,
	'focus-up-window': tasks.focusUpWindow,
	'increase-master-window-count': tasks.increaseMasterWindowCount,
	'on-yabai-start': tasks.onYabaiStart,
	'window-created': tasks.windowCreated,
	'window-moved': tasks.windowMoved,
};

onExit(() => {
	releaseHandlerLock();
});

program
	.name('yabai-master-stack-plugin')
	.showHelpAfterError()
	.addArgument(
		new Argument('<task>').choices([
			'close-focused-window',
			'decrease-master-window-count',
			'focus-down-window',
			'focus-up-window',
			'increase-master-window-count',
			'on-yabai-start',
			'open-new-window',
			'window-created',
			'window-moved',
		]),
	)
	.action(async (taskSlug: string) => {
		const task = tasksMap[taskSlug];
		if (!task) {
			console.error(`Task "${taskSlug}" not found`);
			process.exit(1);
		}

		await task();
	});

program.parse(process.argv);
