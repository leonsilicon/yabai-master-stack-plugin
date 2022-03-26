#!/usr/bin/env node

import process from 'node:process';
import { Argument, program } from 'commander';

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
		])
	)
	.action(async (task: string) => {
		await import(`../fns/${task}.js`);
	});

program.parse(process.argv);
