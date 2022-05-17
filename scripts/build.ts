import { execaCommandSync as exec } from 'execa';
import { rmDist, chProjectDir, copyPackageFiles } from 'lionconfig';

chProjectDir(import.meta.url);
rmDist();
exec('tsc');
exec('tsc-alias');
copyPackageFiles();
