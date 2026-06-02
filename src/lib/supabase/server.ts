import { createClient } from '@supabase/supabase-js';

let instance: any = null;

function getClient() {
  if (instance) return instance;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  instance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return instance;
}

export const supabaseAdmin: any = new Proxy(
  {},
  {
    get(_, prop) {
      if (prop === 'then') return undefined;
      return getClient()[prop];
    },
  },
);
