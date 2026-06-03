export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyPassword, signJwt } from '@/lib/auth';
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

    // Fetch user from DB
    const { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (fetchError || !user) {
      // Use generic error message for security
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Verify salted password hash
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Generate JWT
    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role as 'admin' | 'viewer',
    });

    // Write audit log
    await logAction(user.email, 'LOGIN', `User logged in successfully`);

    // Prepare response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
      },
      token,
    });

    // Set cookie headers securely (Secure in production, HttpOnly, SameSite)
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.append(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Strict${isProd ? '; Secure' : ''}`
    );

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
