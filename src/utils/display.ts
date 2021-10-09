import execa from 'execa';
import getStream from 'get-stream';

import { yabaiPath } from '../config';
import type { Display } from '../types';

export async function getDisplays() {
	const yabaiStdout = execa.command(`${yabaiPath} -m query --displays`).stdout!;
	const yabaiOutput = await getStream(yabaiStdout);
	return JSON.parse(yabaiOutput) as Display[];
}

export async function getFocusedDisplay() {
	const yabaiStdout = execa.command(
		`${yabaiPath} -m query --displays --display`
	).stdout!;
	const yabaiOutput = await getStream(yabaiStdout);
	return JSON.parse(yabaiOutput) as Display;
}
