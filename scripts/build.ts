import * as fs from 'node:fs';
import { execaCommandSync as exec } from 'execa';
import { rmDist, chProjectDir, copyPackageFiles } from 'lion-system';

chProjectDir(import.meta.url);

rmDist();
exec('tsc');
copyPackageFiles();

fs.copyFileSync('plugin-config.cjs', 'dist/plugin-config.cjs');
