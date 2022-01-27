import { execaCommand } from 'execa';

import type { Space } from '../types.js';
import { yabaiPath } from './config.js';
import { getYabaiOutput } from './yabai.js';

export async function getSpaces() {
	const yabaiProcess = execaCommand(`${yabaiPath} -m query --spaces`);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	return JSON.parse(yabaiOutput) as Space[];
}

export async function getFocusedSpace() {
	const yabaiProcess = execaCommand(`${yabaiPath} -m query --spaces --space`);
	const yabaiOutput = await getYabaiOutput(yabaiProcess);
	return JSON.parse(yabaiOutput) as Space;
}
