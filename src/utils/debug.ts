import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as util from 'node:util';

import { getConfig } from '~/utils/config.js';

export function debug(cb: () => unknown) {
	const { debug: isDebugOn } = getConfig();

	if (isDebugOn) {
		fs.appendFileSync(
			path.join(os.homedir(), '.ymsp-log'),
			util.inspect(cb()) + '\n'
		);
		console.error(cb());
	}
}
