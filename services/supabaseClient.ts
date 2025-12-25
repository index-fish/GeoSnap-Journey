
import { createClient } from '@supabase/supabase-js';

// Derived from the provided database connection string: db.vjsllwoxwpgiycxmvdkd.supabase.co
const DEFAULT_URL = 'https://vjsllwoxwpgiycxmvdkd.supabase.co';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_URL;

/**
 * Supabase API Key configuration.
 * Preference order: 
 * 1. Environment variable SUPABASE_ANON_KEY
 * 2. Environment variable SUPABASE_KEY
 * 3. The provided publishable key as a hardcoded fallback
 */
const PROVIDED_KEY = 'sb_publishable_Kvj3LTA1yn3yv6GCX6HbMw_KZ0VB2Fi';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || PROVIDED_KEY;

if (supabaseAnonKey === PROVIDED_KEY && !process.env.SUPABASE_ANON_KEY) {
  console.info("GeoSnap: Using hardcoded fallback Supabase key. For production, please set SUPABASE_ANON_KEY in your environment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
