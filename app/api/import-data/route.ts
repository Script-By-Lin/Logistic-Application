export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';
import { invalidateCache } from '@/lib/apiCache';

export const POST = withAuth(
  async (req, { user }) => {
    try {
      const body = await req.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
      }

      const { table, records } = body;

      const allowedTables = [
        'productions',
        'distributions',
        'returns',
        'village_funding',
        'pipe_types',
        'villages',
        'cars',
        'car_expenses',
        'car_incomes'
      ];

      if (!table || !allowedTables.includes(table)) {
        return NextResponse.json({ error: 'Invalid table name specified.' }, { status: 400 });
      }

      if (!Array.isArray(records) || records.length === 0) {
        return NextResponse.json({ error: 'No records provided for import.' }, { status: 400 });
      }

      let error;
      if (['pipe_types', 'villages', 'cars'].includes(table)) {
        // Metadata tables can use upsert to avoid primary key/unique constraint conflicts
        const result = await supabase!.from(table).upsert(records);
        error = result.error;
      } else {
        // Transactional tables use standard insert
        const result = await supabase!.from(table).insert(records);
        error = result.error;
      }

      if (error) {
        throw error;
      }

      // Invalidate relevant caches
      if (table === 'villages') {
        invalidateCache('villages');
      } else if (table === 'cars') {
        invalidateCache('cars');
        invalidateCache('car_expenses');
        invalidateCache('car_incomes');
      } else if (table === 'car_expenses') {
        invalidateCache('car_expenses');
      } else if (table === 'car_incomes') {
        invalidateCache('car_incomes');
      }
      invalidateCache('audit_logs');

      // Log import activity in the system audit trail
      await logAction(
        user.email,
        `IMPORT_${table.toUpperCase()}`,
        `Imported ${records.length} records into ${table} from Excel file.`
      );

      return NextResponse.json({ success: true, count: records.length });
    } catch (error: any) {
      console.error('Bulk import failed:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to import data records.' },
        { status: 500 }
      );
    }
  },
  { requireAdmin: true }
);
