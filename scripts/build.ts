import process from 'node:process';
import dotenv from 'dotenv';
import { execaCommandSync as exec } from 'execa';
import { rmDist, chProjectDir } from 'lion-system';
import replace from 'replace-in-file';
import { join } from 'desm';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');

dotenv.config({
	path: join(import.meta.url, '..'),
});

replace.sync({
	files: 'dist/config.js',
	from: /process\.env\.\w+!?/g,
	to: (match) => {
		const envVar = match.slice(match.lastIndexOf('.') + 1);
		const envValue = process.env[envVar];
		if (envValue === undefined) {
			// If the environment variable is marked is mandatory
			if (match.endsWith('!')) {
				throw new Error(
					`Environment variable ${envVar} not defined in environment/.env file.`
				);
			} else {
				return 'undefined';
			}
		}

		return JSON.stringify(envValue);
	},
});
