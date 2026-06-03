export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';

export const PATCH = withAuth(
  async (req) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { pipeTypeId, unitPrice } = body;

    if (!pipeTypeId || unitPrice === undefined || typeof unitPrice !== 'number' || unitPrice < 0) {
      return NextResponse.json({ error: 'Valid pipeTypeId and a non-negative unitPrice number are required.' }, { status: 400 });
    }

    const { error } = await supabase!
      .from('pipe_types')
      .update({ unit_price: unitPrice })
      .eq('id', pipeTypeId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);

export const POST = withAuth(
  async (req, { user }) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { name, unitPrice } = body;

    if (!name || typeof name !== 'string' || !name.trim() || unitPrice === undefined || typeof unitPrice !== 'number' || unitPrice < 0) {
      return NextResponse.json({ error: 'Valid name string and a non-negative unitPrice number are required.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    const { error } = await supabase!.from('pipe_types').insert([
      {
        name: trimmedName,
        unit_price: unitPrice,
      },
    ]);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A pipe model with this name already exists.' }, { status: 400 });
      }
      throw error;
    }

    await logAction(
      user.email,
      'CREATE_PIPE_TYPE',
      `Registered new catalog model: ${trimmedName} (Base price: $${unitPrice})`
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
      return NextResponse.json({ error: 'A valid numeric pipe model ID is required.' }, { status: 400 });
    }

    const pipeId = Number(id);

    // 1. Fetch details and run all reference checks in parallel (Single Database Round-trip)
    const [pipeRes, prodCheck, distCheck, returnCheck] = await Promise.all([
      supabase!.from('pipe_types').select('name').eq('id', pipeId).maybeSingle(),
      supabase!.from('productions').select('id').eq('pipe_type_id', pipeId).limit(1),
      supabase!.from('distributions').select('id').eq('pipe_type_id', pipeId).limit(1),
      supabase!.from('returns').select('id').eq('pipe_type_id', pipeId).limit(1),
    ]);

    if (pipeRes.error) {
      throw pipeRes.error;
    }

    if (!pipeRes.data) {
      return NextResponse.json({ error: 'Pipe model not found.' }, { status: 404 });
    }

    const hasProd = prodCheck.data && prodCheck.data.length > 0;
    const hasDist = distCheck.data && distCheck.data.length > 0;
    const hasReturns = returnCheck.data && returnCheck.data.length > 0;

    if (hasProd || hasDist || hasReturns) {
      return NextResponse.json(
        {
          error: 'Cannot delete pipe model. It is actively referenced in existing production/distribution/return transaction logs.',
        },
        { status: 400 }
      );
    }

    const { error: deleteErr } = await supabase!.from('pipe_types').delete().eq('id', pipeId);

    if (deleteErr) {
      throw deleteErr;
    }

    await logAction(user.email, 'DELETE_PIPE_TYPE', `Removed catalog model: ${pipeRes.data.name}`);

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);
