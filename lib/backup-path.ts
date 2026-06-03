import path from 'path';
import os from 'os';

export function getBackupsDir() {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'backups');
  }
  return path.join(process.cwd(), 'backups');
}
