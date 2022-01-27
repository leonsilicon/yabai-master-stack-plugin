import { execaCommand } from 'execa';

import type { Display, DisplayIndex } from '../types.js';
import { yabaiPath } from './config.js';
import { getYabaiOutput } from './yabai.js';

export async function getDisplays() {
	const yabaiProcess = execaCommand(`${yabaiPath} -m query --displays`);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	return JSON.parse(yabaiOutput) as Display[];
}

export async function getFocusedDisplay() {
	const yabaiProcess = execaCommand(
		`${yabaiPath} -m query --displays --display`
	);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	return JSON.parse(yabaiOutput) as Display;
}

export async function focusDisplay(displayIndex: DisplayIndex) {
	await execaCommand(`${yabaiPath} -m display --focus ${displayIndex}`);
}
