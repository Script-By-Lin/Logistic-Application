export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { withAuth } from '@/lib/api-helper';

export const GET = withAuth(
  async () => {
    const { data: logs, error } = await supabase!
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ logs });
  },
  { requireAdmin: true }
);
