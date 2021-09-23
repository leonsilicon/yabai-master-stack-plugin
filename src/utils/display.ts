import execa from 'execa';

import { yabaiPath } from '../config';
import type { Display } from '../types';

export function getFocusedDisplay() {
	return JSON.parse(
		execa.commandSync(`${yabaiPath} -m query --displays --display`).stdout
	) as Display;
}
