/* eslint-disable @typescript-eslint/no-explicit-any */

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
    console.log('Process delivery function started')
    
    // Use service role key to bypass RLS policies
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    
    const { deliveryId, paymentMethod = 'bank', referenceNumber } = requestBody

    if (!deliveryId) {
      console.error('Missing deliveryId in request')
      return new Response(
        JSON.stringify({ error: 'Delivery ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching delivery with ID:', deliveryId)

    // First, try to get basic delivery info without joins
    const { data: basicDelivery, error: basicDeliveryError } = await supabaseClient
      .from('deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single()

    if (basicDeliveryError) {
      console.error('Basic delivery fetch error:', basicDeliveryError)
      if (basicDeliveryError.code === 'PGRST116') {
        throw new Error(`Delivery with ID '${deliveryId}' not found in database. Please check if the delivery exists.`)
      }
      throw new Error(`Failed to fetch delivery: ${basicDeliveryError.message}`)
    }

    if (!basicDelivery) {
      console.error('Delivery not found for ID:', deliveryId)
      throw new Error(`Delivery with ID '${deliveryId}' not found`)
    }

    console.log('Basic delivery found:', basicDelivery)

    // Now try to get related data
    const { data: delivery, error: deliveryError } = await supabaseClient
      .from('deliveries')
      .select(`
        *,
        farmers(id, full_name, farmer_group_id),
        farmer_groups(id, name)
      `)
      .eq('id', deliveryId)
      .single()

    if (deliveryError) {
      console.error('Delivery with relations fetch error:', deliveryError)
      // Continue with basic delivery data
      console.log('Using basic delivery data due to relation fetch error')
    }

    const finalDelivery = delivery || basicDelivery

    console.log('Final delivery data:', { 
      id: finalDelivery.id, 
      farmer_id: finalDelivery.farmer_id, 
      farmer_group_id: finalDelivery.farmer_group_id,
      weight: finalDelivery.weight,
      price_per_kg: finalDelivery.price_per_kg,
      officer_id: finalDelivery.officer_id
    })

    // Check if delivery has already been processed
    const { data: existingPayout, error: payoutCheckError } = await supabaseClient
      .from('payouts')
      .select('id')
      .eq('delivery_id', deliveryId)
      .single()

    if (payoutCheckError && payoutCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Payout check error:', payoutCheckError)
      throw new Error(`Failed to check existing payout: ${payoutCheckError.message}`)
    }

    if (existingPayout) {
      console.error('Delivery already processed:', deliveryId)
      throw new Error('Delivery has already been processed for payment')
    }

    // Get current season (optional)
    let activeSeason = null
    try {
      const { data: season, error: seasonError } = await supabaseClient
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!seasonError) {
        activeSeason = season
      }
    } catch (err) {
      console.log('Season fetch failed, continuing without season')
    }

    console.log('Active season:', (activeSeason as any)?.id)

    // Calculate outstanding loan balance for this farmer group
    let loans: any[] = []
    let totalOutstanding = 0
    
    try {
      const { data: loansData, error: loansError } = await supabaseClient
        .from('loans')
        .select('*')
        .eq('farmer_group_id', finalDelivery.farmer_group_id)
        .gt('outstanding_balance', 0)
        .order('created_at', { ascending: true })

      if (!loansError) {
        loans = loansData || []
        totalOutstanding = loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0)
      }
    } catch (err) {
      console.log('Loans fetch failed, continuing with zero outstanding balance')
    }

    console.log('Found loans:', loans.length)
    console.log('Total outstanding balance:', totalOutstanding)
    
    // Calculate gross amount from delivery
    const grossAmount = finalDelivery.weight * (finalDelivery.price_per_kg || 0)
    console.log('Gross amount calculation:', { weight: finalDelivery.weight, price_per_kg: finalDelivery.price_per_kg, grossAmount })
    
    // Validate gross amount
    if (grossAmount <= 0) {
      console.error('Invalid gross amount:', grossAmount)
      throw new Error('Invalid delivery: weight or price per kg is missing or zero')
    }
    
    // Calculate loan deduction (up to outstanding balance or gross amount, whichever is smaller)
    const loanDeduction = Math.min(totalOutstanding, grossAmount)
    const netPaid = grossAmount - loanDeduction
    
    console.log('Payment calculation:', { grossAmount, loanDeduction, netPaid })

    // Set the user context for audit triggers
    const officerId = finalDelivery.officer_id
    console.log('Setting user context for audit triggers:', officerId)

    // Create payout record with proper user context
    const payoutData = {
      delivery_id: deliveryId,
      gross_amount: grossAmount,
      loan_deduction: loanDeduction,
      net_paid: netPaid,
      method: paymentMethod,
      reference_number: referenceNumber,
      created_by: officerId
    }
    
    console.log('Creating payout with data:', payoutData)
    
    // Create payout record using the database function to bypass audit triggers
    let payout = null
    
    console.log('Creating payout record using database function...')
    
    try {
      // Create payout record directly to avoid RPC function issues
      // Use a try-catch approach to handle audit trigger issues
      let payoutResult = null
      let payoutError = null
      
      try {
        // First attempt: Try with audit trigger enabled
        const result = await supabaseClient
          .from('payouts')
          .insert({
            delivery_id: deliveryId,
            gross_amount: grossAmount,
            loan_deduction: loanDeduction,
            net_paid: netPaid,
            method: paymentMethod,
            reference_number: referenceNumber || null,
            created_by: officerId
          })
          .select()
          .single()
        
        payoutResult = result.data
        payoutError = result.error
      } catch (firstError) {
        console.log('First attempt failed, trying alternative approach:', firstError)
        
        // Second attempt: Try with a different approach using raw SQL
        try {
          const { data, error } = await supabaseClient.rpc('create_payout_safe', {
            p_delivery_id: deliveryId,
            p_gross_amount: grossAmount,
            p_loan_deduction: loanDeduction,
            p_net_paid: netPaid,
            p_method: paymentMethod,
            p_reference_number: referenceNumber || null,
            p_created_by: officerId
          })
          
          payoutResult = data
          payoutError = error
        } catch (secondError) {
          console.log('Second attempt also failed:', secondError)
          payoutError = secondError
        }
      }

      if (payoutError) {
        console.error('Payout creation failed:', payoutError)
        throw new Error(`Failed to create payout: ${payoutError.message}`)
      }
      
      payout = payoutResult
      console.log('Payout created successfully:', payout)
      
    } catch (error) {
      console.error('Payout creation exception:', error)
      throw new Error(`Failed to create payout: ${error.message}`)
    }

    console.log('Payout created successfully:', payout)

    // Update loan balances and create ledger entries (only if there are loans)
    if (loans.length > 0 && loanDeduction > 0) {
      let remainingDeduction = loanDeduction
      
      for (const loan of loans) {
        if (remainingDeduction <= 0) break
        
        const deductionAmount = Math.min(remainingDeduction, (loan as any).outstanding_balance)
        const newBalance = (loan as any).outstanding_balance - deductionAmount
        
        console.log('Processing loan:', { loanId: (loan as any).id, deductionAmount, newBalance })
        
        // Update loan balance directly
        try {
          const { error: updateError } = await supabaseClient
            .from('loans')
            .update({ outstanding_balance: newBalance })
            .eq('id', (loan as any).id)
          
          if (updateError) {
            console.error('Loan update error:', updateError)
            // Continue with other loans even if one fails
          }
        } catch (err) {
          console.error('Loan update failed:', err)
        }
        
        // Create loan ledger entry directly
        try {
          const ledgerData = {
            farmer_id: finalDelivery.farmer_id,
            season_id: (activeSeason as any)?.id,
            loan_id: (loan as any).id,
            entry_type: 'sale_deduction',
            amount: -deductionAmount, // Negative for deduction
            balance_after: newBalance,
            reference_table: 'payouts',
            reference_id: (payout as any)?.id,
            created_by: officerId
          }
          
          console.log('Creating ledger entry:', ledgerData)
          
          const { error: ledgerError } = await supabaseClient
            .from('loan_ledgers')
            .insert(ledgerData)
          
          if (ledgerError) {
            console.error('Ledger creation error:', ledgerError)
            // Continue with other loans even if ledger creation fails
          }
        } catch (err) {
          console.error('Ledger creation failed:', err)
        }
        
        remainingDeduction -= deductionAmount
      }
    }

    console.log('Process delivery completed successfully')

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
    console.error('Process delivery error:', error)
    console.error('Error stack:', error.stack)
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
