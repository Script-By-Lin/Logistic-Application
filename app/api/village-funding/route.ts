export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';

export const GET = withAuth(
  async (req, { user }) => {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    try {
      const { data: funding, error } = await supabase
        .from('village_funding')
        .select('*')
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      return NextResponse.json({ funding });
    } catch (error: any) {
      console.error('Failed to get village funding list:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
);

export const POST = withAuth(
  async (req, { user }) => {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { date, village, type, amount, remark } = body;

    // Validations
    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date string is required.' }, { status: 400 });
    }

    if (!village || typeof village !== 'string' || !village.trim()) {
      return NextResponse.json({ error: 'Village name is required.' }, { status: 400 });
    }

    if (!type || !['disbursement', 'repayment'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "disbursement" or "repayment".' }, { status: 400 });
    }

    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 });
    }

    const trimmedVillage = village.trim();

    try {
      const { data, error } = await supabase
        .from('village_funding')
        .insert([
          {
            date,
            village: trimmedVillage,
            type,
            amount,
            remark: typeof remark === 'string' ? remark.trim() || null : null,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const actionText = type === 'disbursement' ? 'DISBURSE_FUNDING' : 'REPAY_FUNDING';
      const detailsText = type === 'disbursement' 
        ? `Disbursed ${amount} MMK to village "${trimmedVillage}"`
        : `Received repayment of ${amount} MMK from village "${trimmedVillage}"`;

      await logAction(user.email, actionText, detailsText);

      return NextResponse.json({ success: true, record: data });
    } catch (error: any) {
      console.error('Failed to create funding record:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);

export const DELETE = withAuth(
  async (req, { user }) => {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric record ID is required.' }, { status: 400 });
    }

    const recordId = Number(id);

    try {
      // Fetch details before deleting
      const { data: record, error: fetchError } = await supabase
        .from('village_funding')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!record) {
        return NextResponse.json({ error: 'Funding record not found.' }, { status: 404 });
      }

      const { error: deleteError } = await supabase
        .from('village_funding')
        .delete()
        .eq('id', recordId);

      if (deleteError) throw deleteError;

      const detailsText = `Deleted funding record ID ${recordId} (${record.type}): ${record.amount} MMK for village "${record.village}"`;
      await logAction(user.email, 'DELETE_FUNDING', detailsText);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete funding record:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);

export const PATCH = withAuth(
  async (req, { user }) => {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { id, date, village, type, amount, remark } = body;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric record ID is required.' }, { status: 400 });
    }

    const recordId = Number(id);

    // Validations
    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date string is required.' }, { status: 400 });
    }

    if (!village || typeof village !== 'string' || !village.trim()) {
      return NextResponse.json({ error: 'Village name is required.' }, { status: 400 });
    }

    if (!type || !['disbursement', 'repayment'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "disbursement" or "repayment".' }, { status: 400 });
    }

    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 });
    }

    const trimmedVillage = village.trim();

    try {
      // Fetch details before updating for audit logging
      const { data: original, error: fetchError } = await supabase
        .from('village_funding')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!original) {
        return NextResponse.json({ error: 'Funding record not found.' }, { status: 404 });
      }

      const { data, error: updateError } = await supabase
        .from('village_funding')
        .update({
          date,
          village: trimmedVillage,
          type,
          amount,
          remark: typeof remark === 'string' ? remark.trim() || null : null,
        })
        .eq('id', recordId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const actionText = 'UPDATE_FUNDING';
      const detailsText = `Updated funding record ID ${recordId}. Original: ${original.type} of ${original.amount} MMK for village "${original.village}" (${original.remark || 'no remark'}). New: ${type} of ${amount} MMK for village "${trimmedVillage}" (${remark || 'no remark'}).`;

      await logAction(user.email, actionText, detailsText);

      return NextResponse.json({ success: true, record: data });
    } catch (error: any) {
      console.error('Failed to update funding record:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);

