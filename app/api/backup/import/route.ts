export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';
import * as XLSX from 'xlsx';
import { invalidateCache } from '@/lib/apiCache';

export const POST = withAuth(
  async (req, { user }) => {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const tables = ['pipe_types', 'villages', 'productions', 'distributions', 'returns', 'audit_logs'];
      const data: Record<string, any[]> = {};
      
      let foundSheetsCount = 0;
      for (const t of tables) {
        const sheet = workbook.Sheets[t];
        if (sheet) {
          data[t] = XLSX.utils.sheet_to_json(sheet);
          foundSheetsCount++;
        }
      }

      if (foundSheetsCount === 0) {
        return NextResponse.json({
          error: 'The uploaded file does not contain any valid database backup sheets (e.g. pipe_types, distributions).'
        }, { status: 400 });
      }

      const results: Record<string, number> = {};

      // 1. Restore pipe_types
      if (data.pipe_types && data.pipe_types.length > 0) {
        const { error } = await supabase!.from('pipe_types').upsert(data.pipe_types);
        if (error) throw new Error(`Failed to restore pipe_types: ${error.message}`);
        results.pipe_types = data.pipe_types.length;
      }

      // 2. Restore villages
      if (data.villages && data.villages.length > 0) {
        const { error } = await supabase!.from('villages').upsert(data.villages);
        if (error) throw new Error(`Failed to restore villages: ${error.message}`);
        results.villages = data.villages.length;
      }

      // 3. Restore productions
      if (data.productions && data.productions.length > 0) {
        const { error } = await supabase!.from('productions').upsert(data.productions);
        if (error) throw new Error(`Failed to restore productions: ${error.message}`);
        results.productions = data.productions.length;
      }

      // 4. Restore distributions
      if (data.distributions && data.distributions.length > 0) {
        const { error } = await supabase!.from('distributions').upsert(data.distributions);
        if (error) throw new Error(`Failed to restore distributions: ${error.message}`);
        results.distributions = data.distributions.length;
      }

      // 5. Restore returns
      if (data.returns && data.returns.length > 0) {
        const { error } = await supabase!.from('returns').upsert(data.returns);
        if (error) throw new Error(`Failed to restore returns: ${error.message}`);
        results.returns = data.returns.length;
      }

      // 6. Restore audit_logs
      if (data.audit_logs && data.audit_logs.length > 0) {
        const { error } = await supabase!.from('audit_logs').upsert(data.audit_logs);
        if (error) throw new Error(`Failed to restore audit_logs: ${error.message}`);
        results.audit_logs = data.audit_logs.length;
      }

      invalidateCache('villages');
      invalidateCache('audit_logs');

      await logAction(
        user.email,
        'IMPORT_BACKUP',
        `Restored database tables from uploaded Excel backup file containing: ${JSON.stringify(results)}`
      );

      return NextResponse.json({ success: true, results });
    } catch (error: any) {
      console.error('Failed to import backup:', error);
      return NextResponse.json({ error: error.message || 'Failed to restore data from backup file.' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);
