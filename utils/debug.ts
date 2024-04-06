import { getConfig } from '#utils/config.ts';
import fs from 'node:fs';
import os from 'node:os';
import * as util from 'node:util';
import path from 'pathe';

export function debug(cb: () => unknown) {
	const { debug: isDebugOn } = getConfig();

	if (isDebugOn) {
		fs.appendFileSync(
			path.join(os.homedir(), '.ymsp-log'),
			util.inspect(cb()) + '\n',
		);
		console.error(cb());
	}
}
