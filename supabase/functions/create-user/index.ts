import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// WARNING: The service role key should be stored as an environment variable
// in a real production environment. For this example, it's hardcoded,
// but you should use `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';
const SUPABASE_URL = 'YOUR_SUPABASE_URL';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { email, password, role, fullName } = await req.json()

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Create the user in the auth schema
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm user for simplicity
    })

    if (authError) {
      throw authError
    }

    const userId = authData.user.id;

    // 2. Insert the user profile and role into the public users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        full_name: fullName,
        role: role,
      })

    if (profileError) {
        // If profile insert fails, we should probably delete the auth user
        // to avoid orphaned auth entries.
        await supabaseAdmin.auth.admin.deleteUser(userId)
        throw profileError
    }

    return new Response(JSON.stringify({ message: `User ${email} created successfully.` }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    })
  }
})
