import type { Space } from '#types';
import { getConfig } from './config.ts';
import { getYabaiOutput } from './yabai.ts';

export async function getSpaces() {
	const { yabaiPath } = getConfig();
	const yabaiProcess = Bun.spawn([yabaiPath, '-m', 'query', '--spaces'], {
		stdout: 'pipe',
	});
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	return JSON.parse(yabaiOutput) as Space[];
}

export async function getFocusedSpace() {
	const { yabaiPath } = getConfig();
	const yabaiProcess = Bun.spawn([
		yabaiPath,
		'-m',
		'query',
		'--spaces',
		'--space',
	], { stdout: 'pipe' });
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	return JSON.parse(yabaiOutput) as Space;
}
