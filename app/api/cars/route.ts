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
    const cachedCars = getCache<any[]>('cars');
    if (cachedCars) {
      return NextResponse.json({ cars: cachedCars });
    }

    const { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .order('car_number', { ascending: true });

    if (error) {
      throw error;
    }

    setCache('cars', cars || []);
    return NextResponse.json({ cars });
  } catch (error: any) {
    console.error('Failed to get cars list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(
  async (req, { user }) => {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { carNumber } = body;
    if (!carNumber || typeof carNumber !== 'string' || !carNumber.trim()) {
      return NextResponse.json({ error: 'Car Number is required and must be a string.' }, { status: 400 });
    }

    const trimmedCarNumber = carNumber.trim();

    const { data, error } = await supabase
      .from('cars')
      .insert([{ car_number: trimmedCarNumber }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A car with this number already exists.' }, { status: 400 });
      }
      throw error;
    }

    invalidateCache('cars');
    await logAction(user.email, 'CREATE_CAR', `Registered new ferry car: ${trimmedCarNumber}`);

    return NextResponse.json({ success: true, car: data });
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
      return NextResponse.json({ error: 'A valid numeric car ID is required.' }, { status: 400 });
    }

    const carId = Number(id);

    // Fetch car details first
    const { data: car, error: fetchErr } = await supabase
      .from('cars')
      .select('car_number')
      .eq('id', carId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!car) {
      return NextResponse.json({ error: 'Car not found.' }, { status: 404 });
    }

    // Delete car (foreign key cascade deletes expenses and incomes)
    const { error: deleteErr } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);

    if (deleteErr) throw deleteErr;

    invalidateCache('cars');
    invalidateCache('car_expenses');
    invalidateCache('car_incomes');
    await logAction(user.email, 'DELETE_CAR', `Removed ferry car: ${car.car_number}`);

    return NextResponse.json({ success: true });
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

    const { id, carNumber } = body;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'A valid numeric car ID is required.' }, { status: 400 });
    }
    if (!carNumber || typeof carNumber !== 'string' || !carNumber.trim()) {
      return NextResponse.json({ error: 'Car Number is required and must be a string.' }, { status: 400 });
    }

    const carId = Number(id);
    const newCarNumber = carNumber.trim();

    // Fetch current details
    const { data: car, error: fetchErr } = await supabase
      .from('cars')
      .select('car_number')
      .eq('id', carId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!car) {
      return NextResponse.json({ error: 'Car not found.' }, { status: 404 });
    }

    const oldCarNumber = car.car_number;
    if (oldCarNumber === newCarNumber) {
      return NextResponse.json({ success: true, car: { id: carId, car_number: newCarNumber } });
    }

    // Update car
    const { error: updateErr } = await supabase
      .from('cars')
      .update({ car_number: newCarNumber })
      .eq('id', carId);

    if (updateErr) {
      if (updateErr.code === '23505') {
        return NextResponse.json({ error: 'A car with this number already exists.' }, { status: 400 });
      }
      throw updateErr;
    }

    invalidateCache('cars');
    await logAction(user.email, 'UPDATE_CAR', `Renamed ferry car from "${oldCarNumber}" to "${newCarNumber}"`);

    return NextResponse.json({ success: true, car: { id: carId, car_number: newCarNumber } });
  },
  { requireAdmin: true }
);
