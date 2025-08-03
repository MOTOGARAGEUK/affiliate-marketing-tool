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

    // Find the affiliate record for this user
    const { data: affiliate, error: affiliateError } = await authenticatedSupabase
      .from('affiliates')
      .select(`
        id,
        name,
        email,
        status,
        program_id,
        programs (
          id,
          name,
          type,
          commission,
          commission_type
        )
      `)
      .eq('email', user.email)
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Get referral statistics
    const { data: referrals, error: referralsError } = await authenticatedSupabase
      .from('referrals')
      .select(`
        id,
        customer_name,
        customer_email,
        commission,
        status,
        sharetribe_validation_status,
        created_at
      `)
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch referral data' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalReferrals = referrals?.length || 0;
    const verifiedReferrals = referrals?.filter(r => r.sharetribe_validation_status === 'green').length || 0;
    
    // Calculate total earnings (only from verified referrals)
    const totalEarnings = referrals
      ?.filter(r => r.sharetribe_validation_status === 'green')
      .reduce((sum, r) => sum + (r.commission || 0), 0) || 0;

    // Get recent referrals (last 10)
    const recentReferrals = referrals?.slice(0, 10) || [];

    // Calculate pending payouts (simplified - could be enhanced with actual payout logic)
    const pendingPayouts = totalEarnings; // For now, all earnings are pending

    const stats = {
      totalReferrals,
      verifiedReferrals,
      totalEarnings,
      pendingPayouts,
      recentReferrals
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Failed to fetch affiliate stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliate stats' },
      { status: 500 }
    );
  }
} 