import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Test function started')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Test basic connection
    const { data: testData, error: testError } = await supabaseClient
      .from('deliveries')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Connection test failed:', testError)
      return new Response(
        JSON.stringify({ error: `Database connection failed: ${testError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Test table structure
    const tables = ['deliveries', 'payouts', 'loans', 'loan_ledgers', 'farmers', 'farmer_groups', 'seasons']
    const tableChecks = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabaseClient
          .from(table)
          .select('*')
          .limit(1)
        
        tableChecks[table] = {
          exists: !error,
          error: error?.message || null
        }
      } catch (err) {
        tableChecks[table] = {
          exists: false,
          error: err.message
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database connection successful',
        tableChecks,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Test function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
