export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';
import { getCache, setCache, invalidateCache } from '@/lib/apiCache';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  try {
    const cachedVillages = getCache<any[]>('villages');
    if (cachedVillages) {
      return NextResponse.json({ villages: cachedVillages });
    }

    const { data: villages, error } = await supabase
      .from('villages')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    setCache('villages', villages || []);
    return NextResponse.json({ villages });
  } catch (error: any) {
    console.error('Failed to get villages list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(
  async (req, { user }) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { name } = body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Village name is required and must be a string.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    const { data, error } = await supabase!
      .from('villages')
      .insert([{ name: trimmedName }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An outpost with this name already exists.' }, { status: 400 });
      }
      throw error;
    }

    invalidateCache('villages');
    await logAction(user.email, 'CREATE_VILLAGE', `Created new outpost node: ${trimmedName}`);

    return NextResponse.json({ success: true, village: data });
  },
  { requireAdmin: true }
);

export const DELETE = withAuth(
  async (req, { user }) => {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric village ID is required.' }, { status: 400 });
    }

    const villageId = Number(id);

    // 1. Fetch village details
    const { data: village, error: fetchErr } = await supabase!
      .from('villages')
      .select('name')
      .eq('id', villageId)
      .maybeSingle();

    if (fetchErr) {
      throw fetchErr;
    }

    if (!village) {
      return NextResponse.json({ error: 'Village not found.' }, { status: 404 });
    }

    // 2. Check references in distributions and returns in parallel
    const [distCheck, returnCheck] = await Promise.all([
      supabase!.from('distributions').select('id').eq('village', village.name).limit(1),
      supabase!.from('returns').select('id').eq('village', village.name).limit(1),
    ]);

    const hasDist = distCheck.data && distCheck.data.length > 0;
    const hasReturns = returnCheck.data && returnCheck.data.length > 0;

    if (hasDist || hasReturns) {
      return NextResponse.json(
        {
          error: 'Cannot delete outpost. It is actively referenced in existing distribution/return transaction logs.',
        },
        { status: 400 }
      );
    }

    // 3. Delete village
    const { error: deleteErr } = await supabase!
      .from('villages')
      .delete()
      .eq('id', villageId);

    if (deleteErr) {
      throw deleteErr;
    }

    invalidateCache('villages');
    await logAction(user.email, 'DELETE_VILLAGE', `Removed outpost node: ${village.name}`);

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);

export const PUT = withAuth(
  async (req, { user }) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { id, name } = body;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric village ID is required.' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Village name is required and must be a string.' }, { status: 400 });
    }

    const villageId = Number(id);
    const newName = name.trim();

    // 1. Fetch current village details
    const { data: village, error: fetchErr } = await supabase!
      .from('villages')
      .select('name')
      .eq('id', villageId)
      .maybeSingle();

    if (fetchErr) {
      throw fetchErr;
    }

    if (!village) {
      return NextResponse.json({ error: 'Village not found.' }, { status: 404 });
    }

    const oldName = village.name;

    if (oldName === newName) {
      return NextResponse.json({ success: true, village: { id: villageId, name: newName } });
    }

    // 2. Check if new name already exists
    const { data: existingVillage, error: checkErr } = await supabase!
      .from('villages')
      .select('id')
      .eq('name', newName)
      .maybeSingle();

    if (checkErr) {
      throw checkErr;
    }

    if (existingVillage) {
      return NextResponse.json({ error: 'An outpost with this name already exists.' }, { status: 400 });
    }

    // 3. Update villages table
    const { error: updateErr } = await supabase!
      .from('villages')
      .update({ name: newName })
      .eq('id', villageId);

    if (updateErr) {
      throw updateErr;
    }

    // 4. Cascade name changes to related transaction logs
    const [distUpdate, returnsUpdate, fundingUpdate] = await Promise.all([
      supabase!.from('distributions').update({ village: newName }).eq('village', oldName),
      supabase!.from('returns').update({ village: newName }).eq('village', oldName),
      supabase!.from('village_funding').update({ village: newName }).eq('village', oldName),
    ]);

    if (distUpdate.error) console.error('Failed to update distributions for renamed village:', distUpdate.error);
    if (returnsUpdate.error) console.error('Failed to update returns for renamed village:', returnsUpdate.error);
    if (fundingUpdate.error) console.error('Failed to update village_funding for renamed village:', fundingUpdate.error);

    // 5. Invalidate caches and log
    invalidateCache('villages');
    invalidateCache('audit_logs');
    await logAction(user.email, 'UPDATE_VILLAGE', `Renamed outpost node from "${oldName}" to "${newName}"`);

    return NextResponse.json({ success: true, village: { id: villageId, name: newName } });
  },
  { requireAdmin: true }
);

