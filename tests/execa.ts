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

	const command = '-m query --window';

	suite
		.add(
			'execa + getYabaiOutput',
			p(async () => {
				const yabaiProcess = execa(yabaiPath, parse(command) as string[]);
				await getYabaiOutput(yabaiProcess);
			})
		)
		.add(
			'child_process.exec',
			p(async () => {
				await execute(`${yabaiPath} ${command}`);
			})
		)
		.on('cycle', (event: any) => {
			console.log(String(event.target));
		})
		.run({ async: true });
}

void main();
