import os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import onetime from 'onetime';
import type { YabaiMasterStackPluginConfig } from '~/types.js';

export const getConfig = onetime(() => {
	try {
		const configPath = path.join(os.homedir(), '.config/ysmp/ysmp.config.json');

		return JSON.parse(
			fs.readFileSync(configPath).toString()
		) as YabaiMasterStackPluginConfig;
	} catch (error: unknown) {
		const err = error as Error & { code: string };
		if (err.code === 'ENOENT') {
			throw new Error(
				'The config file at ~/.config/ysmp.config.json file was not found.'
			);
		} else {
			throw err;
		}
	}
});
