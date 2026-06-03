export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';

export const POST = withAuth(
  async (req, { user }) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { date, pipeTypeId, quantity, batchId } = body;

    // Validate parameters
    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date string is required.' }, { status: 400 });
    }

    if (!pipeTypeId || typeof pipeTypeId !== 'number' || !Number.isInteger(pipeTypeId) || pipeTypeId <= 0) {
      return NextResponse.json({ error: 'A valid numeric pipe model ID is required.' }, { status: 400 });
    }

    if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive integer.' }, { status: 400 });
    }

    const trimmedBatchId = typeof batchId === 'string' ? batchId.trim() : null;

    // Verify pipe type exists
    const { data: pipeExists, error: pipeErr } = await supabase!
      .from('pipe_types')
      .select('id')
      .eq('id', pipeTypeId)
      .maybeSingle();

    if (pipeErr) throw pipeErr;
    if (!pipeExists) {
      return NextResponse.json({ error: 'The specified pipe model does not exist.' }, { status: 400 });
    }

    // Database Insertion
    const { error } = await supabase!.from('productions').insert([
      {
        date,
        pipe_type_id: pipeTypeId,
        quantity,
        batch_id: trimmedBatchId || null,
      },
    ]);

    if (error) {
      throw error;
    }

    // Audit Log
    await logAction(
      user.email,
      'CREATE_PRODUCTION',
      `Logged central production: ${quantity} units of pipe model ID ${pipeTypeId} (Batch: ${trimmedBatchId || 'None'})`
    );

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);

export const DELETE = withAuth(
  async (req, { user }) => {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric production record ID is required.' }, { status: 400 });
    }

    const recordId = Number(id);

    // Single query: Delete and return the deleted record for audit logging (1 Database Round-trip)
    const { data: record, error: deleteError } = await supabase!
      .from('productions')
      .delete()
      .eq('id', recordId)
      .select()
      .maybeSingle();

    if (deleteError) {
      throw deleteError;
    }

    if (!record) {
      return NextResponse.json({ error: 'Production record not found.' }, { status: 404 });
    }

    await logAction(
      user.email,
      'DELETE_PRODUCTION',
      `Deleted central production record ID ${recordId}: ${record.quantity} units of pipe type ID ${record.pipe_type_id} (Batch: ${record.batch_id || 'None'})`
    );

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);

export const PATCH = withAuth(
  async (req, { user }) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { id, date, pipeTypeId, quantity, batchId } = body;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric record ID is required.' }, { status: 400 });
    }

    const recordId = Number(id);

    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date string is required.' }, { status: 400 });
    }

    if (!pipeTypeId || typeof pipeTypeId !== 'number' || !Number.isInteger(pipeTypeId) || pipeTypeId <= 0) {
      return NextResponse.json({ error: 'A valid numeric pipe model ID is required.' }, { status: 400 });
    }

    if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive integer.' }, { status: 400 });
    }

    const trimmedBatchId = typeof batchId === 'string' ? batchId.trim() : null;

    // Parallel validation: Check original record and target pipe type in parallel
    const [originalRes, pipeRes] = await Promise.all([
      supabase!.from('productions').select('*').eq('id', recordId).maybeSingle(),
      supabase!.from('pipe_types').select('id').eq('id', pipeTypeId).maybeSingle(),
    ]);

    if (originalRes.error) throw originalRes.error;
    if (pipeRes.error) throw pipeRes.error;

    if (!originalRes.data) {
      return NextResponse.json({ error: 'Production record not found.' }, { status: 404 });
    }

    if (!pipeRes.data) {
      return NextResponse.json({ error: 'The specified pipe model does not exist.' }, { status: 400 });
    }

    const original = originalRes.data;

    const { error: updateError } = await supabase!
      .from('productions')
      .update({
        date,
        pipe_type_id: pipeTypeId,
        quantity,
        batch_id: trimmedBatchId || null,
      })
      .eq('id', recordId);

    if (updateError) {
      throw updateError;
    }

    await logAction(
      user.email,
      'UPDATE_PRODUCTION',
      `Updated central production record ID ${recordId}. Original: ${original.quantity} units of pipe ID ${original.pipe_type_id} (Batch: ${original.batch_id || 'None'}). New: ${quantity} units of pipe ID ${pipeTypeId} (Batch: ${trimmedBatchId || 'None'}).`
    );

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);
