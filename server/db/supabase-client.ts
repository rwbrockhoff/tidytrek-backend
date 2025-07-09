import { createClient } from '@supabase/supabase-js';

const supabaseClient = process.env.SUPABASE_CLIENT;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY;

// @ts-expect-error: value will exist as string in env file
export const supabase = createClient(supabaseClient, supabaseKey);
