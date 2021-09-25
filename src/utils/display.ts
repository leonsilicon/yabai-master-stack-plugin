import execa from 'execa';

import { yabaiPath } from '../config';
import type { Display } from '../types';

export function getDisplays() {
	return JSON.parse(
		execa.commandSync(`${yabaiPath} -m query --displays`).stdout
	) as Display[];
}

export function getFocusedDisplay() {
	return JSON.parse(
		execa.commandSync(`${yabaiPath} -m query --displays --display`).stdout
	) as Display;
}
