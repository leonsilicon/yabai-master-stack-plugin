import 'dotenv/config';

import { exec } from 'node:child_process';

import Benchmark from 'benchmark';
import { execa, execaCommand, execaCommandSync } from 'execa';
import { parse } from 'shell-quote';

import { getConfig, getYabaiOutput } from '~/utils/index.js';

import { p } from './utils.js';

async function execute(command: string) {
	return new Promise((resolve) => {
		exec(command, (stdout) => {
			resolve(stdout);
		});
	});
}

const { yabaiPath } = getConfig();
const suite = new Benchmark.Suite();

const command = ' -m query --windows --window';
const parsedCommand = parse(command) as string[];

suite
	.add(
		'execa + getYabaiOutput',
		p(async () => {
			const yabaiProcess = execa(yabaiPath, parsedCommand);
			const _output = await getYabaiOutput(yabaiProcess);
		})
	)
	.add('execa + commandSync', () => {
		const _output = execaCommandSync(yabaiPath + command).stdout;
	})
	.add(
		'execa + command',
		p(async () => {
			const execaResult = await execaCommand(yabaiPath + command);
			const _output = execaResult.stdout;
		})
	)
	.add(
		'child_process.exec',
		p(async () => {
			const _output = await execute(yabaiPath + command);
		})
	)
	.on('cycle', (event: any) => {
		console.info(String(event.target));
	})
	.run({ async: true });
