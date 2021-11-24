import { commandSync } from 'execa';

console.time('perf-test');
for (let i = 0; i < 50; i += 1) {
	commandSync('node dist/fns/focus-up-window.js');
}
console.timeEnd('perf-test')