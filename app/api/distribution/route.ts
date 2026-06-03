export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';

function sum(records: Array<{ quantity: number }>) {
  return records.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

export const POST = withAuth(
  async (req, { user }) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { date, village, batchId, quantity, price, fromLocation, toLocation, remark } = body;

    // Parameter validations
    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date string is required.' }, { status: 400 });
    }

    if (!village || typeof village !== 'string' || !village.trim()) {
      return NextResponse.json({ error: 'Outpost village name is required.' }, { status: 400 });
    }

    if (!batchId || typeof batchId !== 'string' || !batchId.trim()) {
      return NextResponse.json({ error: 'Batch ID is required.' }, { status: 400 });
    }

    if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive integer.' }, { status: 400 });
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
    }

    const trimmedBatchId = batchId.trim();

    // 1. Parallel verification (Single Database Round-trip)
    const [prodRes, distRes, retRes] = await Promise.all([
      supabase!.from('productions').select('pipe_type_id, quantity').eq('batch_id', trimmedBatchId),
      supabase!.from('distributions').select('quantity').eq('batch_id', trimmedBatchId),
      supabase!.from('returns').select('quantity').eq('batch_id', trimmedBatchId),
    ]);

    if (prodRes.error) throw prodRes.error;
    if (distRes.error) throw distRes.error;
    if (retRes.error) throw retRes.error;

    if (!prodRes.data || prodRes.data.length === 0) {
      return NextResponse.json({ error: `Production batch "${trimmedBatchId}" not found.` }, { status: 400 });
    }

    const inferredPipeTypeId = prodRes.data[0].pipe_type_id;

    // 2. Stock Level Calculations
    const produced = sum(prodRes.data);
    const distributed = sum(distRes.data || []);
    const returned = sum(retRes.data || []);
    const available = produced - distributed + returned;

    if (quantity > available) {
      return NextResponse.json(
        {
          error: `Insufficient factory stock for this batch. Available: ${available} units, Requested: ${quantity} units.`,
        },
        { status: 400 }
      );
    }

    // 3. Database Insertion
    const { error } = await supabase!.from('distributions').insert([
      {
        date,
        village: village.trim(),
        pipe_type_id: inferredPipeTypeId,
        quantity,
        price,
        from_location: typeof fromLocation === 'string' ? fromLocation.trim() || null : null,
        to_location: typeof toLocation === 'string' ? toLocation.trim() || null : null,
        remark: typeof remark === 'string' ? remark.trim() || null : null,
        batch_id: trimmedBatchId,
      },
    ]);

    if (error) {
      throw error;
    }

    // 4. Audit Log
    await logAction(
      user.email,
      'AUTHORIZE_DISTRIBUTION',
      `Delivered ${quantity} units of batch "${trimmedBatchId}" (model ID ${inferredPipeTypeId}) to outpost: ${village}`
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
      return NextResponse.json({ error: 'A valid numeric distribution record ID is required.' }, { status: 400 });
    }

    const recordId = Number(id);

    // Single Query: Delete and fetch details (1 Database Round-trip)
    const { data: record, error: deleteError } = await supabase!
      .from('distributions')
      .delete()
      .eq('id', recordId)
      .select()
      .maybeSingle();

    if (deleteError) {
      throw deleteError;
    }

    if (!record) {
      return NextResponse.json({ error: 'Distribution record not found.' }, { status: 404 });
    }

    await logAction(
      user.email,
      'DELETE_DISTRIBUTION',
      `Deleted distribution record ID ${recordId}: ${record.quantity} units to village "${record.village}"`
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

    const { id, date, village, batchId, quantity, price, fromLocation, toLocation, remark } = body;

    // Validate parameters
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric record ID is required.' }, { status: 400 });
    }

    const recordId = Number(id);

    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date string is required.' }, { status: 400 });
    }

    if (!village || typeof village !== 'string' || !village.trim()) {
      return NextResponse.json({ error: 'Outpost village name is required.' }, { status: 400 });
    }

    if (!batchId || typeof batchId !== 'string' || !batchId.trim()) {
      return NextResponse.json({ error: 'Batch ID is required.' }, { status: 400 });
    }

    if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive integer.' }, { status: 400 });
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
    }

    const trimmedBatchId = batchId.trim();

    // 1. Parallel verification including retrieval of original (Single Database Round-trip)
    const [originalRes, prodRes, distRes, retRes] = await Promise.all([
      supabase!.from('distributions').select('*').eq('id', recordId).maybeSingle(),
      supabase!.from('productions').select('pipe_type_id, quantity').eq('batch_id', trimmedBatchId),
      supabase!.from('distributions').select('quantity').eq('batch_id', trimmedBatchId).neq('id', recordId),
      supabase!.from('returns').select('quantity').eq('batch_id', trimmedBatchId),
    ]);

    if (originalRes.error) throw originalRes.error;
    if (prodRes.error) throw prodRes.error;
    if (distRes.error) throw distRes.error;
    if (retRes.error) throw retRes.error;

    if (!originalRes.data) {
      return NextResponse.json({ error: 'Distribution record not found.' }, { status: 404 });
    }

    if (!prodRes.data || prodRes.data.length === 0) {
      return NextResponse.json({ error: `Production batch "${trimmedBatchId}" not found.` }, { status: 400 });
    }

    const original = originalRes.data;
    const inferredPipeTypeId = prodRes.data[0].pipe_type_id;

    // 2. Stock Level Calculations
    const produced = sum(prodRes.data);
    const distributedOther = sum(distRes.data || []);
    const returned = sum(retRes.data || []);
    const available = produced - distributedOther + returned;

    if (quantity > available) {
      return NextResponse.json(
        {
          error: `Insufficient factory stock for this batch update. Available: ${available} units, Requested: ${quantity} units.`,
        },
        { status: 400 }
      );
    }

    // 3. Database Update
    const { error } = await supabase!
      .from('distributions')
      .update({
        date,
        village: village.trim(),
        pipe_type_id: inferredPipeTypeId,
        quantity,
        price,
        from_location: typeof fromLocation === 'string' ? fromLocation.trim() || null : null,
        to_location: typeof toLocation === 'string' ? toLocation.trim() || null : null,
        remark: typeof remark === 'string' ? remark.trim() || null : null,
        batch_id: trimmedBatchId,
      })
      .eq('id', recordId);

    if (error) {
      throw error;
    }

    // 4. Audit Log
    await logAction(
      user.email,
      'UPDATE_DISTRIBUTION',
      `Updated distribution record ID ${recordId} (batch "${trimmedBatchId}") to village "${village}". Original qty: ${original.quantity}, New qty: ${quantity}`
    );

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);
