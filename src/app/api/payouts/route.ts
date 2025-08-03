import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create an authenticated client with the user's token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch affiliates with their referrals, program data, and bank details
    const { data: affiliates, error: affiliatesError } = await authenticatedSupabase
      .from('affiliates')
      .select(`
        id,
        name,
        email,
        status,
        created_at,
        bank_account_name,
        bank_account_number,
        bank_sort_code,
        bank_iban,
        bank_routing_number,
        bank_name,
        referrals (
          id,
          status,
          commission,
          created_at,
          sharetribe_validation_status,
          programs (
            id,
            name,
            commission,
            commission_type,
            type
          )
        )
      `)
      .eq('user_id', user.id);

    if (affiliatesError) {
      console.error('Error fetching affiliates:', affiliatesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch affiliates' },
        { status: 500 }
      );
    }

    // Fetch existing payouts to calculate outstanding amounts
    const { data: existingPayouts, error: payoutsError } = await authenticatedSupabase
      .from('payouts')
      .select('*')
      .eq('user_id', user.id);

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payouts' },
        { status: 500 }
      );
    }

    // Calculate payouts for each affiliate - only verified referrals
    const payouts = affiliates?.map(affiliate => {
      const approvedReferrals = affiliate.referrals?.filter(r => r.status === 'approved') || [];
      const verifiedReferrals = approvedReferrals.filter(r => r.sharetribe_validation_status === 'green') || [];
      
      console.log(`Debug - Affiliate ${affiliate.name}:`, {
        totalReferrals: affiliate.referrals?.length || 0,
        approvedReferrals: approvedReferrals.length,
        verifiedReferrals: verifiedReferrals.length,
        referrals: affiliate.referrals?.map(r => ({
          status: r.status,
          sharetribe_validation_status: r.sharetribe_validation_status,
          commission: r.commission
        }))
      });
      
      let totalEarnings = 0;
      let totalReferrals = approvedReferrals.length;
      let verifiedReferralsCount = verifiedReferrals.length;
      
      // Calculate earnings based on verified referrals and program commission rates
      verifiedReferrals.forEach(referral => {
        const program = referral.programs;
        if (program) {
          // Skip reward programs - they don't contribute to earnings
          if (program.type === 'reward') {
            return; // Skip this referral
          }
          
          if (program.commission_type === 'fixed') {
            totalEarnings += program.commission;
          } else if (program.commission_type === 'percentage') {
            // For percentage, we need a base amount - using a default of 100 for now
            // In a real scenario, this would be the actual transaction amount
            totalEarnings += (program.commission / 100) * 100; // Default base amount
          }
        }
      });

      // Calculate total paid to this affiliate
      const affiliatePayouts = existingPayouts?.filter(p => p.affiliate_id === affiliate.id) || [];
      const totalPaid = affiliatePayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
      
      // Calculate outstanding amount
      const outstandingAmount = Math.max(0, totalEarnings - totalPaid);

      // Debug: Log the affiliate data to see what's being returned
      console.log(`Debug - Affiliate ${affiliate.name} bank details:`, {
        bank_name: affiliate.bank_name,
        bank_account_name: affiliate.bank_account_name,
        bank_account_number: affiliate.bank_account_number,
        bank_sort_code: affiliate.bank_sort_code,
        bank_iban: affiliate.bank_iban,
        bank_routing_number: affiliate.bank_routing_number
      });

      return {
        id: affiliate.id,
        affiliateId: affiliate.id,
        affiliateName: affiliate.name,
        affiliateEmail: affiliate.email,
        affiliateStatus: affiliate.status,
        // Bank details
        bank_name: affiliate.bank_name,
        bank_account_name: affiliate.bank_account_name,
        bank_account_number: affiliate.bank_account_number,
        bank_sort_code: affiliate.bank_sort_code,
        bank_iban: affiliate.bank_iban,
        bank_routing_number: affiliate.bank_routing_number,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        amount: Math.round(outstandingAmount * 100) / 100, // Outstanding amount
        totalReferrals,
        approvedReferrals: totalReferrals,
        verifiedReferrals: verifiedReferralsCount,
        pendingReferrals: affiliate.referrals?.filter(r => r.status === 'pending').length || 0,
        rejectedReferrals: affiliate.referrals?.filter(r => r.status === 'rejected').length || 0,
        status: outstandingAmount > 0 ? 'pending' : 'paid',
        method: 'bank', // Default method
        reference: `PAY-${affiliate.id.slice(0, 8)}`,
        createdAt: affiliate.created_at,
        lastReferralDate: verifiedReferrals.length > 0 
          ? Math.max(...verifiedReferrals.map(r => new Date(r.created_at).getTime()))
          : null
      };
    }) || [];

    // Show all affiliates who have earned money (have verified referrals), not just those with outstanding amounts
    const payoutsWithEarnings = payouts.filter(payout => payout.totalEarnings > 0);

    // Calculate summary stats
    const totalPayoutsOwed = payoutsWithEarnings.reduce((sum, payout) => sum + payout.amount, 0);
    const totalPayoutsPaid = payoutsWithEarnings.reduce((sum, payout) => sum + payout.totalPaid, 0);
    const totalAffiliatesWithEarnings = payoutsWithEarnings.length;
    const totalReferrals = payouts.reduce((sum, payout) => sum + payout.totalReferrals, 0);

    return NextResponse.json({
      success: true,
      payouts: payoutsWithEarnings,
      allPayouts: payouts, // Include all payouts for reference
      summary: {
        totalPayoutsOwed: Math.round(totalPayoutsOwed * 100) / 100,
        totalPayoutsPaid: Math.round(totalPayoutsPaid * 100) / 100,
        totalAffiliatesWithEarnings,
        totalReferrals,
        totalAffiliates: payouts.length
      }
    });

  } catch (error) {
    console.error('Failed to fetch payouts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create an authenticated client with the user's token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { affiliateId, amount, method, reference } = body;

    if (!affiliateId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payout data' },
        { status: 400 }
      );
    }

    if (!reference || reference.length > 18) {
      return NextResponse.json(
        { success: false, message: 'Invalid reference (max 18 characters)' },
        { status: 400 }
      );
    }

    // Create payout record
    const { data: payout, error: createError } = await authenticatedSupabase
      .from('payouts')
      .insert({
        affiliate_id: affiliateId,
        amount: amount,
        method: method,
        status: 'pending',
        reference: reference,
        user_id: user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating payout:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create payout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payout created successfully',
      payout
    });

  } catch (error) {
    console.error('Failed to create payout:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create payout' },
      { status: 500 }
    );
  }
} 