import type { ExecaChildProcess } from 'execa';
import { execaSync } from 'execa';
import getStream from 'get-stream';
import type { Window, Yabai3Window, Space, Yabai3Space } from '~/types/yabai.js';
import { getConfig } from '~/utils/config.js';

export async function getYabaiOutput(yabaiProcess: ExecaChildProcess) {
	return new Promise<string>((resolve) => {
		void getStream(yabaiProcess.stdout!).then((output) => {
			resolve(output);
		});
	});
}

export function getYabaiVersion(): 3 | 4 {
	const { yabaiPath } = getConfig();
	const versionString = execaSync(yabaiPath, ['--version']).stdout;
	const majorVersionNumberString = /^yabai-v(\d+)\./.exec(versionString)?.[1];
	if (majorVersionNumberString === undefined) {
		throw new Error('Could not determine yabai version.');
	}

	const majorVersionNumber = Number(majorVersionNumberString);
	if (majorVersionNumber < 3 || majorVersionNumber > 4) {
		throw new Error(`yabai version ${versionString} is not supported.`);
	}

	return Number(majorVersionNumber) as 3 | 4;
}

export function isYabai3Window(window: Window): window is Yabai3Window {
	return 'native-fullscreen' in window;
}

export function isYabai3Space(space: Space): space is Yabai3Space {
	return 'native-fullscreen' in space;
}
