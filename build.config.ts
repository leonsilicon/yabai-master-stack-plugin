import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['./bin/ymsp.ts'],
	outDir: '.build',
	rollup: {
		inlineDependencies: true
	}
});
