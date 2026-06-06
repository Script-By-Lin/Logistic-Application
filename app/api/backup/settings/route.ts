export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helper';
import { getBackupsDir } from '@/lib/backup-path';
import { logAction } from '@/lib/audit';
import fs from 'fs/promises';
import path from 'path';

const getSettingsFilePath = () => path.join(getBackupsDir(), 'settings.json');

async function getBackupSettings() {
  const filePath = getSettingsFilePath();
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      autoBackup: true,
      intervalDays: 15,
    };
  }
}

export const GET = withAuth(
  async () => {
    try {
      const settings = await getBackupSettings();
      return NextResponse.json({ settings });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to retrieve settings.' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);

export const POST = withAuth(
  async (req, { user }) => {
    try {
      const { autoBackup, intervalDays } = await req.json();
      if (typeof autoBackup !== 'boolean' || typeof intervalDays !== 'number' || intervalDays <= 0) {
        return NextResponse.json({ error: 'Invalid settings parameters.' }, { status: 400 });
      }

      const backupsDir = getBackupsDir();
      await fs.mkdir(backupsDir, { recursive: true });
      const filePath = getSettingsFilePath();
      const newSettings = { autoBackup, intervalDays };
      await fs.writeFile(filePath, JSON.stringify(newSettings, null, 2), 'utf-8');

      await logAction(
        user.email,
        'UPDATE_BACKUP_SETTINGS',
        `Updated auto-backup settings: Auto-Backup=${autoBackup}, Interval=${intervalDays} days`
      );

      return NextResponse.json({ success: true, settings: newSettings });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);
