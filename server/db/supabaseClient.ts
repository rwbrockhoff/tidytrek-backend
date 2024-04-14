import { createClient } from '@supabase/supabase-js';
import { getSecret } from '../utils/getSecrets.js';

const supabaseClient = getSecret('SUPABASE_CLIENT');
const supabaseKey = getSecret('SUPABASE_PRIVATE_KEY');

export const supabase = createClient(supabaseClient, supabaseKey);
