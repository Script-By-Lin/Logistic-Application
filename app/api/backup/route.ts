export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';
import { getBackupsDir } from '@/lib/backup-path';
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

async function createBackupFile(userEmail: string, isAuto = false) {
  const backupsDir = getBackupsDir();
  await fs.mkdir(backupsDir, { recursive: true });

  // Fetch all tables from database
  const [
    pipeTypesRes,
    villagesRes,
    productionsRes,
    distributionsRes,
    returnsRes,
    auditLogsRes,
    villageFundingRes,
  ] = await Promise.all([
    supabase!.from('pipe_types').select('*'),
    supabase!.from('villages').select('*'),
    supabase!.from('productions').select('*'),
    supabase!.from('distributions').select('*'),
    supabase!.from('returns').select('*'),
    supabase!.from('audit_logs').select('*'),
    supabase!.from('village_funding').select('*'),
  ]);

  if (pipeTypesRes.error) throw pipeTypesRes.error;
  if (villagesRes.error) throw villagesRes.error;
  if (productionsRes.error) throw productionsRes.error;
  if (distributionsRes.error) throw distributionsRes.error;
  if (returnsRes.error) throw returnsRes.error;
  if (auditLogsRes.error) throw auditLogsRes.error;
  if (villageFundingRes.error) throw villageFundingRes.error;

  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      pipe_types: pipeTypesRes.data || [],
      villages: villagesRes.data || [],
      productions: productionsRes.data || [],
      distributions: distributionsRes.data || [],
      returns: returnsRes.data || [],
      audit_logs: auditLogsRes.data || [],
      village_funding: villageFundingRes.data || [],
    },
  };

  const dateStr = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
  const filename = `backup_${dateStr}.json`;
  const filePath = path.join(backupsDir, filename);

  await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  await logAction(
    userEmail,
    'CREATE_BACKUP',
    isAuto
      ? `Automatically created database backup archive file: ${filename}`
      : `Created database backup archive file: ${filename}`
  );

  return filename;
}

export const GET = withAuth(
  async (req, { user }) => {
    const backupsDir = getBackupsDir();
    try {
      await fs.mkdir(backupsDir, { recursive: true });
      const files = await fs.readdir(backupsDir);
      const backups = [];

      for (const file of files) {
        if (file.startsWith('backup_') && file.endsWith('.json')) {
          const filePath = path.join(backupsDir, file);
          const stats = await fs.stat(filePath);
          backups.push({
            filename: file,
            sizeBytes: stats.size,
            createdAt: stats.mtime.toISOString(),
          });
        }
      }

      // Sort by creation date descending
      backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const settings = await getBackupSettings();

      // Auto backup check
      if (settings.autoBackup) {
        let shouldBackup = false;
        if (backups.length === 0) {
          shouldBackup = true;
        } else {
          const newestBackupTime = new Date(backups[0].createdAt).getTime();
          const millisecondsElapsed = Date.now() - newestBackupTime;
          const daysElapsed = millisecondsElapsed / (24 * 60 * 60 * 1000);
          if (daysElapsed >= settings.intervalDays) {
            shouldBackup = true;
          }
        }

        if (shouldBackup) {
          try {
            console.log('[Auto-Backup] Backup is due. Triggering automatic backup.');
            const filename = await createBackupFile(user.email, true);
            const filePath = path.join(backupsDir, filename);
            const stats = await fs.stat(filePath);
            
            // Push the new auto-backup to the top of list
            backups.unshift({
              filename,
              sizeBytes: stats.size,
              createdAt: stats.mtime.toISOString(),
            });
          } catch (autoErr) {
            console.error('Failed to create automatic backup:', autoErr);
          }
        }
      }

      return NextResponse.json({ backups, settings });
    } catch (error: any) {
      console.error('Failed to list backups:', error);
      return NextResponse.json({ error: 'Failed to retrieve backups list.' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);

export const POST = withAuth(
  async (req, { user }) => {
    try {
      const filename = await createBackupFile(user.email, false);
      return NextResponse.json({ success: true, filename });
    } catch (error: any) {
      console.error('Failed to create backup:', error);
      return NextResponse.json({ error: error.message || 'Failed to create database snapshot.' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);

export const DELETE = withAuth(
  async (req, { user }) => {
    const url = new URL(req.url);
    const filename = url.searchParams.get('filename');

    if (!filename || !filename.startsWith('backup_') || !filename.endsWith('.json') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid backup filename.' }, { status: 400 });
    }

    const backupsDir = getBackupsDir();
    const filePath = path.join(backupsDir, filename);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);

      await logAction(
        user.email,
        'DELETE_BACKUP',
        `Deleted database backup snapshot file: ${filename}`
      );

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete backup file:', error);
      return NextResponse.json({ error: 'Backup file not found or could not be deleted.' }, { status: 404 });
    }
  },
  { requireAdmin: true }
);
