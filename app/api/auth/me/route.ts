export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getJwtFromCookies, verifyJwt, hashPassword, signJwt } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/lib/audit';
import { withAuth } from '@/lib/api-helper';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('Cookie');
    const token = getJwtFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: payload.email,
        role: payload.role,
      },
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export const PUT = withAuth(
  async (req, { user }) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { email, password } = body;
    const updates: any = {};

    if (email !== undefined) {
      if (typeof email !== 'string') {
        return NextResponse.json({ error: 'Email must be a string.' }, { status: 400 });
      }
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail !== user.email) {
        if (!EMAIL_REGEX.test(trimmedEmail)) {
          return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
        }

        // Check if email already exists
        const { data: existingUser, error: checkErr } = await supabase!
          .from('app_users')
          .select('id')
          .eq('email', trimmedEmail)
          .maybeSingle();

        if (checkErr) throw checkErr;
        if (existingUser) {
          return NextResponse.json({ error: 'Email is already in use.' }, { status: 400 });
        }
        updates.email = trimmedEmail;
      }
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }
      updates.password_hash = hashPassword(password);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, user: { email: user.email, role: user.role } });
    }

    // Update user in DB
    const { error: updateErr } = await supabase!
      .from('app_users')
      .update(updates)
      .eq('id', user.userId);

    if (updateErr) throw updateErr;

    const newEmail = updates.email || user.email;

    // Log action
    await logAction(
      user.email,
      'UPDATE_PROFILE',
      `Updated profile information. Email changed: ${updates.email ? 'yes' : 'no'}, Password changed: ${updates.password_hash ? 'yes' : 'no'}`
    );

    // Generate new JWT
    const token = signJwt({
      userId: user.userId,
      email: newEmail,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        email: newEmail,
        role: user.role,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    response.headers.append(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Strict${isProd ? '; Secure' : ''}`
    );

    return response;
  }
);
