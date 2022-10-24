import * as fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import onetime from 'onetime';

import type { YabaiMasterStackPluginConfig } from '~/types/yabai.js';

export const getConfig = onetime(() => {
	try {
		const configPath = path.join(os.homedir(), '.config/ymsp/ymsp.config.json');

		const config = JSON.parse(
			fs.readFileSync(configPath).toString()
		) as Partial<YabaiMasterStackPluginConfig>;

		const defaultConfig: YabaiMasterStackPluginConfig = {
			masterPosition: 'right',
			moveNewWindowsToMaster: false,
			debug: false,
			yabaiPath: '/usr/local/bin/yabai',
		};

		return {
			...defaultConfig,
			...config,
		};
	} catch (error: unknown) {
		const err = error as Error & { code: string };
		if (err.code === 'ENOENT') {
			throw new Error(
				'The config file at ~/.config/ymsp/ymsp.config.json file was not found.'
			);
		} else {
			throw err;
		}
	}
});
