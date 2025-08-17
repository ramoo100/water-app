import { createClient } from '@supabase/supabase-js'

// Read the Supabase URL and Anon Key from the environment variables.
// Vite exposes env variables on `import.meta.env`
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create and export the Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
