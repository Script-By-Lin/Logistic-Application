export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';
import fs from 'fs/promises';
import path from 'path';

const getBackupsDir = () => path.join(process.cwd(), 'backups');

export const GET = withAuth(
  async () => {
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

      return NextResponse.json({ backups });
    } catch (error: any) {
      console.error('Failed to list backups:', error);
      return NextResponse.json({ error: 'Failed to retrieve backups list.' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);

export const POST = withAuth(
  async (req, { user }) => {
    const backupsDir = getBackupsDir();
    try {
      await fs.mkdir(backupsDir, { recursive: true });

      // Fetch all tables from database
      const [
        pipeTypesRes,
        villagesRes,
        productionsRes,
        distributionsRes,
        returnsRes,
        auditLogsRes,
      ] = await Promise.all([
        supabase!.from('pipe_types').select('*'),
        supabase!.from('villages').select('*'),
        supabase!.from('productions').select('*'),
        supabase!.from('distributions').select('*'),
        supabase!.from('returns').select('*'),
        supabase!.from('audit_logs').select('*'),
      ]);

      if (pipeTypesRes.error) throw pipeTypesRes.error;
      if (villagesRes.error) throw villagesRes.error;
      if (productionsRes.error) throw productionsRes.error;
      if (distributionsRes.error) throw distributionsRes.error;
      if (returnsRes.error) throw returnsRes.error;
      if (auditLogsRes.error) throw auditLogsRes.error;

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
        },
      };

      const dateStr = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const filename = `backup_${dateStr}.json`;
      const filePath = path.join(backupsDir, filename);

      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

      await logAction(
        user.email,
        'CREATE_BACKUP',
        `Created database backup archive file: ${filename}`
      );

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
