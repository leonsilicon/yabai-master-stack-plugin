import type { Display, DisplayIndex } from '#types';
import { getConfig } from '#utils/config.ts';
import { getYabaiOutput } from './yabai.ts';

export async function getDisplays() {
	const { yabaiPath } = getConfig();
	const yabaiProcess = Bun.spawn([yabaiPath, '-m', 'query', '--displays']);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	return JSON.parse(yabaiOutput) as Display[];
}

export async function getFocusedDisplay() {
	const { yabaiPath } = getConfig();
	const yabaiProcess = Bun.spawn([
		yabaiPath,
		'-m',
		'query',
		'--displays',
		'--display',
	]);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	return JSON.parse(yabaiOutput) as Display;
}

export async function focusDisplay(displayIndex: DisplayIndex) {
	const { yabaiPath } = getConfig();
	await Bun.spawn([
		yabaiPath,
		'-m',
		'display',
		'--focus',
		displayIndex.toString(),
	]);
}
