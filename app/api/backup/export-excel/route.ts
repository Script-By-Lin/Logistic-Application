export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helper';
import { getBackupsDir } from '@/lib/backup-path';
import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';

export const GET = withAuth(
  async (req) => {
    const url = new URL(req.url);
    const filename = url.searchParams.get('filename');

    if (!filename || !filename.startsWith('backup_') || !filename.endsWith('.json') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid backup filename.' }, { status: 400 });
    }

    const backupsDir = getBackupsDir();
    const filePath = path.join(backupsDir, filename);

    try {
      await fs.access(filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const backup = JSON.parse(fileContent);

      if (!backup || !backup.data) {
        return NextResponse.json({ error: 'Invalid backup file contents.' }, { status: 400 });
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // 1. Overview sheet
      const overviewData = [
        ['Database Backup Report', ''],
        ['Backup File', filename],
        ['Created At', backup.timestamp || 'Unknown'],
        ['Backup Version', backup.version || '1.0'],
        ['', ''],
        ['Table Name', 'Row Count'],
      ];

      const tables = ['pipe_types', 'villages', 'productions', 'distributions', 'returns', 'audit_logs', 'village_funding', 'cars', 'car_expenses', 'car_incomes'];
      for (const t of tables) {
        const count = backup.data[t] ? backup.data[t].length : 0;
        overviewData.push([t, count]);
      }

      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

      // 2. Add each data table as a sheet
      for (const t of tables) {
        const records = backup.data[t] || [];
        const ws = XLSX.utils.json_to_sheet(records);
        XLSX.utils.book_append_sheet(wb, ws, t);
      }

      // Write to a buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const xlsxFilename = filename.replace('.json', '.xlsx');

      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${xlsxFilename}"`,
        },
      });
    } catch (error: any) {
      console.error('Failed to export to Excel:', error);
      return NextResponse.json({ error: 'Failed to generate Excel report: ' + error.message }, { status: 500 });
    }
  },
  { requireAdmin: true }
);
