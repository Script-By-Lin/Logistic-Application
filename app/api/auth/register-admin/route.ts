export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { hashPassword } from '@/lib/auth';
import { logAction } from '@/lib/audit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required and must be strings.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: 'Database check failed.' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    // Hash password with salt
    const hashedPassword = hashPassword(password);

    // Insert new administrator
    const { error: insertError } = await supabase.from('app_users').insert([
      {
        email: trimmedEmail,
        password_hash: hashedPassword,
        role: 'admin',
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create admin user.' }, { status: 500 });
    }

    // Log the registration event
    await logAction('System', 'REGISTER_ADMIN', `Registered new admin account: ${trimmedEmail}`);

    return NextResponse.json({ success: true, message: 'Admin account created successfully.' });
  } catch (error: any) {
    console.error('Register admin error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
