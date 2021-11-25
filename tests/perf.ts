import 'dotenv/config';

import Benchmark from 'benchmark';
import execa from 'execa';
import path from 'path';

function p(fn: any) {
	return {
		defer: true,
		async fn(deferred: any) {
			await fn();
			deferred.resolve();
		},
	};
}

const suite = new Benchmark.Suite();

const fnsPath = path.join(__dirname, '../dist/fns');
const focusUpWindowCommand = `node ${path.join(fnsPath, 'focus-up-window.js')}`;

suite
	.add('focus-up-window', () => {
		execa.commandSync(focusUpWindowCommand);
	})
	.on('cycle', (event: any) => {
		console.log(String(event.target));
	})
	.run({ async: true });
