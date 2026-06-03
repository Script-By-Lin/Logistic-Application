import { NextResponse } from 'next/server';
import { supabase } from './supabaseClient';
import { getJwtFromCookies, verifyJwt, JwtPayload } from './auth';

export type ApiHandler = (
  req: Request,
  context: { user: JwtPayload; params: any }
) => Promise<NextResponse> | NextResponse;

export interface WithAuthOptions {
  requireAdmin?: boolean;
}

export function withAuth(handler: ApiHandler, options?: WithAuthOptions) {
  return async (req: Request, context: any) => {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    try {
      const cookieHeader = req.headers.get('Cookie');
      const token = getJwtFromCookies(cookieHeader);

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
      }

      const payload = verifyJwt(token);
      if (!payload) {
        return NextResponse.json({ error: 'Session expired or invalid. Please login again.' }, { status: 401 });
      }

      if (options?.requireAdmin && payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
      }

      return await handler(req, { user: payload, params: context?.params || {} });
    } catch (error: any) {
      console.error('API execution failed:', error);
      return NextResponse.json(
        { error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}
