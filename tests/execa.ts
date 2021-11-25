import 'dotenv/config';

import Benchmark from 'benchmark';
import { exec } from 'child_process';
import execa from 'execa';
import { parse } from 'shell-quote';

import { yabaiPath } from '../src/config';
import { getYabaiOutput } from '../src/utils/yabai';
import { p } from './utils';

async function execute(command: string) {
	return new Promise((resolve) => {
		exec(command, (stdout) => {
			resolve(stdout);
		});
	});
}

async function main() {
	const suite = new Benchmark.Suite();

	const command = '-m query --windows --window';

	suite
		.add(
			'execa + getYabaiOutput',
			p(async () => {
				const yabaiProcess = execa(yabaiPath, parse(command) as string[]);
				const _output = await getYabaiOutput(yabaiProcess);
			})
		)
		.add('execa + commandSync', () => {
			const _output = execa.commandSync(`${yabaiPath} ${command}`).stdout;
		})
		.add(
			'execa + command',
			p(async () => {
				const execaResult = await execa.command(`${yabaiPath} ${command}`);
				const _output = execaResult.stdout;
			})
		)
		.add(
			'child_process.exec',
			p(async () => {
				const _output = await execute(`${yabaiPath} ${command}`);
			})
		)
		.on('cycle', (event: any) => {
			console.log(String(event.target));
		})
		.run({ async: true });
}

void main();
