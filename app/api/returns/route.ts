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

    const { date, village, batchId, quantity, status, price, remark } = body;

    // Validate parameters
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

    if (!status || !['damaged', 'production_grade'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "damaged" or "production_grade".' }, { status: 400 });
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
    }

    const trimmedBatchId = batchId.trim();
    const trimmedVillage = village.trim();

    // 1. Parallel verification (Single Database Round-trip)
    const [prodRes, distRes, retRes] = await Promise.all([
      supabase!.from('productions').select('pipe_type_id').eq('batch_id', trimmedBatchId),
      supabase!.from('distributions').select('quantity, remark').eq('batch_id', trimmedBatchId).eq('village', trimmedVillage),
      supabase!.from('returns').select('quantity, status, remark').eq('batch_id', trimmedBatchId).eq('village', trimmedVillage),
    ]);

    if (prodRes.error) throw prodRes.error;
    if (distRes.error) throw distRes.error;
    if (retRes.error) throw retRes.error;

    if (!prodRes.data || prodRes.data.length === 0) {
      return NextResponse.json({ error: `Production batch "${trimmedBatchId}" not found.` }, { status: 400 });
    }

    const inferredPipeTypeId = prodRes.data[0].pipe_type_id;

    // 2. Village Balance Verification
    const isResentReturn = remark && remark.includes('is-resent');
    const distData = distRes.data || [];
    const retData = retRes.data || [];

    const normalDistributed = sum(distData.filter((d: any) => !d.remark || !d.remark.includes('is-resent')));
    const resentDistributed = sum(distData.filter((d: any) => d.remark && d.remark.includes('is-resent')));

    const normalReturned = sum(retData.filter((r: any) => !r.remark || !r.remark.includes('is-resent')));
    const resentReturned = sum(retData.filter((r: any) => r.remark && r.remark.includes('is-resent')));

    const balance = isResentReturn 
      ? (resentDistributed - resentReturned) 
      : (normalDistributed - normalReturned);

    if (quantity > balance) {
      return NextResponse.json(
        {
          error: `Return quantity (${quantity} units) exceeds available village ${isResentReturn ? 'resent ' : ''}balance (${balance} units) for this batch.`,
        },
        { status: 400 }
      );
    }

    // 3. Database Insertion
    const { error } = await supabase!.from('returns').insert([
      {
        date,
        village: trimmedVillage,
        pipe_type_id: inferredPipeTypeId,
        quantity,
        status,
        price,
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
      'PROCESS_RETURN',
      `Processed return of ${quantity} units (${status}) of batch "${trimmedBatchId}" (model ID ${inferredPipeTypeId}) from outpost: ${trimmedVillage} at unit price: ${price}`
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
      return NextResponse.json({ error: 'A valid numeric return record ID is required.' }, { status: 400 });
    }

    const recordId = Number(id);

    // Single Query: Delete and return details (1 Database Round-trip)
    const { data: record, error: deleteError } = await supabase!
      .from('returns')
      .delete()
      .eq('id', recordId)
      .select()
      .maybeSingle();

    if (deleteError) {
      throw deleteError;
    }

    if (!record) {
      return NextResponse.json({ error: 'Return record not found.' }, { status: 404 });
    }

    await logAction(
      user.email,
      'DELETE_RETURN',
      `Deleted return record ID ${recordId}: ${record.quantity} units from village "${record.village}"`
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

    const { id, date, village, batchId, quantity, status, price, remark } = body;

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

    if (!status || !['damaged', 'production_grade'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "damaged" or "production_grade".' }, { status: 400 });
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
    }

    const trimmedBatchId = batchId.trim();
    const trimmedVillage = village.trim();

    // 1. Parallel verification including retrieval of original (Single Database Round-trip)
    const [originalRes, prodRes, distRes, retRes] = await Promise.all([
      supabase!.from('returns').select('*').eq('id', recordId).maybeSingle(),
      supabase!.from('productions').select('pipe_type_id').eq('batch_id', trimmedBatchId),
      supabase!.from('distributions').select('quantity, remark').eq('batch_id', trimmedBatchId).eq('village', trimmedVillage),
      supabase!.from('returns').select('quantity, status, remark').eq('batch_id', trimmedBatchId).eq('village', trimmedVillage).neq('id', recordId),
    ]);

    if (originalRes.error) throw originalRes.error;
    if (prodRes.error) throw prodRes.error;
    if (distRes.error) throw distRes.error;
    if (retRes.error) throw retRes.error;

    if (!originalRes.data) {
      return NextResponse.json({ error: 'Return record not found.' }, { status: 404 });
    }

    if (!prodRes.data || prodRes.data.length === 0) {
      return NextResponse.json({ error: `Production batch "${trimmedBatchId}" not found.` }, { status: 400 });
    }

    const original = originalRes.data;
    const inferredPipeTypeId = prodRes.data[0].pipe_type_id;

    // 2. Village Balance Verification
    const isResentReturn = remark && remark.includes('is-resent');
    const distData = distRes.data || [];
    const retData = retRes.data || [];

    const normalDistributed = sum(distData.filter((d: any) => !d.remark || !d.remark.includes('is-resent')));
    const resentDistributed = sum(distData.filter((d: any) => d.remark && d.remark.includes('is-resent')));

    const normalReturned = sum(retData.filter((r: any) => !r.remark || !r.remark.includes('is-resent')));
    const resentReturned = sum(retData.filter((r: any) => r.remark && r.remark.includes('is-resent')));

    const balance = isResentReturn 
      ? (resentDistributed - resentReturned) 
      : (normalDistributed - normalReturned);

    if (quantity > balance) {
      return NextResponse.json(
        {
          error: `Return quantity (${quantity} units) exceeds outstanding village ${isResentReturn ? 'resent ' : ''}balance (${balance} units) for this batch.`,
        },
        { status: 400 }
      );
    }

    // 3. Database Update
    const { error } = await supabase!
      .from('returns')
      .update({
        date,
        village: trimmedVillage,
        pipe_type_id: inferredPipeTypeId,
        quantity,
        status,
        price,
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
      'UPDATE_RETURN',
      `Updated return record ID ${recordId} (batch "${trimmedBatchId}") from village "${trimmedVillage}". Original qty: ${original.quantity}, New qty: ${quantity}, price: ${price}`
    );

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);
