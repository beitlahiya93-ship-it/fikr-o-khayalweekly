import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'fikr_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  // Fallback to import.meta.env
  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig) {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(config.url, config.anonKey);
    }
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to init Supabase client', err);
    return null;
  }
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}
