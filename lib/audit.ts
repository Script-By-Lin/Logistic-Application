import { supabase } from '@/lib/supabaseClient';

export async function logAction(userEmail: string, action: string, details?: string) {
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').insert([
      {
        user_email: userEmail,
        action,
        details: details || null,
      },
    ]);
  } catch (error) {
    console.error('Failed to insert audit log:', error);
  }
}
