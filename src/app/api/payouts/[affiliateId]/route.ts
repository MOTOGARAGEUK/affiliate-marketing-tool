import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { affiliateId: string } }
) {
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

    const affiliateId = params.affiliateId;

    // Fetch referrals for this affiliate
    const { data: referrals, error: referralsError } = await authenticatedSupabase
      .from('referrals')
      .select(`
        id,
        customer_email,
        customer_name,
        status,
        created_at,
        sharetribe_validation_status,
        programs (
          id,
          name,
          commission,
          commission_type
        )
      `)
      .eq('user_id', user.id)
      .eq('affiliate_id', affiliateId)
      .eq('sharetribe_validation_status', 'green') // Only verified referrals
      .order('created_at', { ascending: true });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    // Fetch payouts for this affiliate
    const { data: payouts, error: payoutsError } = await authenticatedSupabase
      .from('payouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: true });

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payouts' },
        { status: 500 }
      );
    }

    // Create transaction history by combining referrals and payouts
    const transactions = [];

    // Add referrals as transactions
    referrals?.forEach(referral => {
      let amount = 0;
      const program = referral.programs;
      if (program) {
        if (program.commission_type === 'fixed') {
          amount = program.commission;
        } else if (program.commission_type === 'percentage') {
          amount = (program.commission / 100) * 100; // Default base amount
        }
      }

      transactions.push({
        id: referral.id,
        type: 'referral',
        date: referral.created_at,
        description: `Referral: ${referral.customer_name || referral.customer_email}`,
        amount: amount,
        status: referral.status,
        program: program?.name || 'Unknown Program'
      });
    });

    // Add payouts as transactions
    payouts?.forEach(payout => {
      transactions.push({
        id: payout.id,
        type: 'payout',
        date: payout.created_at,
        description: `Payout: ${payout.method} payment`,
        amount: -payout.amount, // Negative to show as outgoing
        status: payout.status,
        reference: payout.reference
      });
    });

    // Sort all transactions by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      transactions,
      referrals: referrals || [],
      payouts: payouts || []
    });

  } catch (error) {
    console.error('Failed to fetch affiliate transactions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliate transactions' },
      { status: 500 }
    );
  }
} 