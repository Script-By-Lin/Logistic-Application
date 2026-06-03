export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helper';
import fs from 'fs/promises';
import path from 'path';

export const GET = withAuth(
  async (req) => {
    const url = new URL(req.url);
    const filename = url.searchParams.get('filename');

    if (!filename || !filename.startsWith('backup_') || !filename.endsWith('.json') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid backup filename.' }, { status: 400 });
    }

    const backupsDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupsDir, filename);

    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error('Failed to download backup:', error);
      return NextResponse.json({ error: 'Backup file not found.' }, { status: 404 });
    }
  },
  { requireAdmin: true }
);
