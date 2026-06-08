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
      const cachedExpenses = getCache<any[]>('car_expenses');
      if (cachedExpenses) {
        return NextResponse.json({ expenses: cachedExpenses });
      }

      const { data: expenses, error } = await supabase
        .from('car_expenses')
        .select('*')
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      setCache('car_expenses', expenses || []);
      return NextResponse.json({ expenses });
    } catch (error: any) {
      console.error('Failed to get car expenses list:', error);
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

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'Reason is required and must be a string.' }, { status: 400 });
    }

    const numericCarId = Number(carId);
    const trimmedReason = reason.trim();

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
        .from('car_expenses')
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

      invalidateCache('car_expenses');
      await logAction(
        user.email,
        'CREATE_CAR_EXPENSE',
        `Logged expense of ${amount} MMK for car "${car.car_number}" on ${date}. Reason: ${trimmedReason}`
      );

      return NextResponse.json({ success: true, record: data });
    } catch (error: any) {
      console.error('Failed to create car expense:', error);
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
        .from('car_expenses')
        .select('*, cars(car_number)')
        .eq('id', recordId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!record) {
        return NextResponse.json({ error: 'Car expense record not found.' }, { status: 404 });
      }

      const { error: deleteError } = await supabase
        .from('car_expenses')
        .delete()
        .eq('id', recordId);

      if (deleteError) throw deleteError;

      invalidateCache('car_expenses');
      const carNum = (record as any).cars?.car_number || 'Unknown';
      await logAction(
        user.email,
        'DELETE_CAR_EXPENSE',
        `Deleted car expense ID ${recordId} of ${record.amount} MMK for car "${carNum}"`
      );

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete car expense:', error);
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

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'Reason is required and must be a string.' }, { status: 400 });
    }

    const numericCarId = Number(carId);
    const trimmedReason = reason.trim();

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
        .from('car_expenses')
        .select('*, cars(car_number)')
        .eq('id', recordId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!original) {
        return NextResponse.json({ error: 'Car expense record not found.' }, { status: 404 });
      }

      const { data, error } = await supabase
        .from('car_expenses')
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

      invalidateCache('car_expenses');
      const oldCarNum = (original as any).cars?.car_number || 'Unknown';
      await logAction(
        user.email,
        'UPDATE_CAR_EXPENSE',
        `Updated car expense ID ${recordId}. Original: car "${oldCarNum}", ${original.amount} MMK, reason "${original.reason}". New: car "${car.car_number}", ${amount} MMK, reason "${trimmedReason}".`
      );

      return NextResponse.json({ success: true, record: data });
    } catch (error: any) {
      console.error('Failed to update car expense:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { requireAdmin: true }
);
