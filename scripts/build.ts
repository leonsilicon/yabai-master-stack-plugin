import * as path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import execa from 'execa';
import { rmDist, chProjectDir } from 'lion-system';
import pkgDir from 'pkg-dir';
import replace from 'replace-in-file';
import desm from 'desm';

chProjectDir(import.meta.url);
rmDist();
execa.sync('tsc');

dotenv.config({
	path: path.join(pkgDir.sync(desm(import.meta.url))!, '.env'),
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
