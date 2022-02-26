import { execaCommandSync as exec } from 'execa';
import { rmDist, chProjectDir, copyPackageFiles } from 'lion-system';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
exec('tsc-alias');
copyPackageFiles();
