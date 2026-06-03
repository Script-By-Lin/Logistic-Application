export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { withAuth } from '@/lib/api-helper';
import { getCache, setCache } from '@/lib/apiCache';

export const GET = withAuth(
  async () => {
    const cachedLogs = getCache<any[]>('audit_logs');
    if (cachedLogs) {
      return NextResponse.json({ logs: cachedLogs });
    }

    const { data: logs, error } = await supabase!
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    setCache('audit_logs', logs || []);
    return NextResponse.json({ logs });
  },
  { requireAdmin: true }
);
