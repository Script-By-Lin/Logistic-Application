export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';
import { getCache, setCache, invalidateCache } from '@/lib/apiCache';

export const GET = withAuth(
  async (req, { user }) => {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    try {
      const cachedIncomes = getCache<any[]>('car_incomes');
      if (cachedIncomes) {
        return NextResponse.json({ incomes: cachedIncomes });
      }

      const { data: incomes, error } = await supabase
        .from('car_incomes')
        .select('*')
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      setCache('car_incomes', incomes || []);
      return NextResponse.json({ incomes });
    } catch (error: any) {
      console.error('Failed to get car incomes list:', error);
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

    const { carId, date, amount, reason } = body;

    // Parameter validations
    if (!carId || isNaN(Number(carId))) {
      return NextResponse.json({ error: 'A valid numeric Car ID is required.' }, { status: 400 });
    }

    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date string is required.' }, { status: 400 });
    }

    if (amount === undefined || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Amount must be a non-negative number.' }, { status: 400 });
    }

    const numericCarId = Number(carId);
    const trimmedReason = typeof reason === 'string' ? reason.trim() || null : null;

    try {
      // Check if car exists
      const { data: car, error: carCheckErr } = await supabase
        .from('cars')
        .select('car_number')
        .eq('id', numericCarId)
        .maybeSingle();

      if (carCheckErr) throw carCheckErr;
      if (!car) {
        return NextResponse.json({ error: 'Referenced car not found.' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('car_incomes')
        .insert([
          {
            car_id: numericCarId,
            date,
            amount,
            reason: trimmedReason,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      invalidateCache('car_incomes');
      await logAction(
        user.email,
        'CREATE_CAR_INCOME',
        `Logged income of ${amount} MMK for car "${car.car_number}" on ${date}. Details: ${trimmedReason || 'None'}`
      );

      return NextResponse.json({ success: true, record: data });
    } catch (error: any) {
      console.error('Failed to create car income:', error);
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
        .from('car_incomes')
        .select('*, cars(car_number)')
        .eq('id', recordId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!record) {
        return NextResponse.json({ error: 'Car income record not found.' }, { status: 404 });
      }

      const { error: deleteError } = await supabase
        .from('car_incomes')
        .delete()
        .eq('id', recordId);

      if (deleteError) throw deleteError;

      invalidateCache('car_incomes');
      const carNum = (record as any).cars?.car_number || 'Unknown';
      await logAction(
        user.email,
        'DELETE_CAR_INCOME',
        `Deleted car income ID ${recordId} of ${record.amount} MMK for car "${carNum}"`
      );

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete car income:', error);
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

    const { id, carId, date, amount, reason } = body;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric record ID is required.' }, { status: 400 });
    }

    const recordId = Number(id);

    // Parameter validations
    if (!carId || isNaN(Number(carId))) {
      return NextResponse.json({ error: 'A valid numeric Car ID is required.' }, { status: 400 });
    }

    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date string is required.' }, { status: 400 });
    }

    if (amount === undefined || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Amount must be a non-negative number.' }, { status: 400 });
    }

    const numericCarId = Number(carId);
    const trimmedReason = typeof reason === 'string' ? reason.trim() || null : null;

    try {
      // Check if car exists
      const { data: car, error: carCheckErr } = await supabase
        .from('cars')
        .select('car_number')
        .eq('id', numericCarId)
        .maybeSingle();

      if (carCheckErr) throw carCheckErr;
      if (!car) {
        return NextResponse.json({ error: 'Referenced car not found.' }, { status: 400 });
      }

      // Fetch original record details
      const { data: original, error: fetchError } = await supabase
        .from('car_incomes')
        .select('*, cars(car_number)')
        .eq('id', recordId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!original) {
        return NextResponse.json({ error: 'Car income record not found.' }, { status: 404 });
      }

      const { data, error } = await supabase
        .from('car_incomes')
        .update({
          car_id: numericCarId,
          date,
          amount,
          reason: trimmedReason,
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;

      invalidateCache('car_incomes');
      const oldCarNum = (original as any).cars?.car_number || 'Unknown';
      await logAction(
        user.email,
        'UPDATE_CAR_INCOME',
        `Updated car income ID ${recordId}. Original: car "${oldCarNum}", ${original.amount} MMK, details "${original.reason || 'None'}". New: car "${car.car_number}", ${amount} MMK, details "${trimmedReason || 'None'}".`
      );

      return NextResponse.json({ success: true, record: data });
    } catch (error: any) {
      console.error('Failed to update car income:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);
