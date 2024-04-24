import os from 'node:os';
import path from 'pathe';

const ymspConfigDirpath = path.join(os.homedir(), '.config/ymsp');
export const lockfilePath = path.join(ymspConfigDirpath, 'ymsp.lock');
