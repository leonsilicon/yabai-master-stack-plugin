import 'dotenv/config';

import Benchmark from 'benchmark';

import { createInitializedWindowsManager } from '../src/utils/window';

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

suite
	.add(
		'createInitializedWindowsManager',
		p(async () => {
			await createInitializedWindowsManager();
		})
	)
	.on('cycle', (event: any) => {
		console.log(String(event.target));
	})
	.run({ async: true });
