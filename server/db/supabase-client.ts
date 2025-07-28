import { createClient } from '@supabase/supabase-js';
import { validateEnvironment } from '../config/environment.js';

const env = validateEnvironment();

export const supabase = createClient(env.SUPABASE_CLIENT, env.SUPABASE_PRIVATE_KEY);
