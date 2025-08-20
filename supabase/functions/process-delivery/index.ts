
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const { deliveryId, paymentMethod = 'bank', referenceNumber } = await req.json()

    if (!deliveryId) {
      return new Response(
        JSON.stringify({ error: 'Delivery ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get delivery details with farmer and club info
    const { data: delivery, error: deliveryError } = await supabaseClient
      .from('deliveries')
      .select(`
        *,
        farmers!inner(id, full_name, farmer_group_id),
        farmer_groups!inner(id, name)
      `)
      .eq('id', deliveryId)
      .single()

    if (deliveryError) {
      throw new Error(`Failed to fetch delivery: ${deliveryError.message}`)
    }

    // Get current season
    const { data: activeSeason } = await supabaseClient
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .single()

    // Calculate outstanding loan balance for this farmer in current season
    const { data: loans, error: loansError } = await supabaseClient
      .from('loans')
      .select('*')
      .eq('farmer_group_id', delivery.farmer_group_id)
      .gt('outstanding_balance', 0)
      .order('created_at', { ascending: true })

    if (loansError) {
      throw new Error(`Failed to fetch loans: ${loansError.message}`)
    }

    // Calculate total outstanding balance
    const totalOutstanding = loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0
    
    // Calculate gross amount from delivery
    const grossAmount = delivery.weight * (delivery.price_per_kg || 0)
    
    // Calculate loan deduction (up to outstanding balance or gross amount, whichever is smaller)
    const loanDeduction = Math.min(totalOutstanding, grossAmount)
    const netPaid = grossAmount - loanDeduction

    // Create payout record
    const { data: payout, error: payoutError } = await supabaseClient
      .from('payouts')
      .insert({
        delivery_id: deliveryId,
        gross_amount: grossAmount,
        loan_deduction: loanDeduction,
        net_paid: netPaid,
        method: paymentMethod,
        reference_number: referenceNumber,
        created_by: delivery.officer_id
      })
      .select()
      .single()

    if (payoutError) {
      throw new Error(`Failed to create payout: ${payoutError.message}`)
    }

    // Update loan balances and create ledger entries
    let remainingDeduction = loanDeduction
    
    for (const loan of loans || []) {
      if (remainingDeduction <= 0) break
      
      const deductionAmount = Math.min(remainingDeduction, loan.outstanding_balance)
      const newBalance = loan.outstanding_balance - deductionAmount
      
      // Update loan balance
      await supabaseClient
        .from('loans')
        .update({ outstanding_balance: newBalance })
        .eq('id', loan.id)
      
      // Create loan ledger entry
      await supabaseClient
        .from('loan_ledgers')
        .insert({
          farmer_id: delivery.farmer_id,
          season_id: activeSeason?.id,
          loan_id: loan.id,
          entry_type: 'sale_deduction',
          amount: -deductionAmount, // Negative for deduction
          balance_after: newBalance,
          reference_table: 'payouts',
          reference_id: payout.id,
          created_by: delivery.officer_id
        })
      
      remainingDeduction -= deductionAmount
    }

    return new Response(
      JSON.stringify({
        success: true,
        payout,
        deductionApplied: loanDeduction,
        netPaid,
        message: `Payment processed successfully. Deducted ${loanDeduction} from outstanding loans.`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
