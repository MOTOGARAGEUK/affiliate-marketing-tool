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

    // Fetch all data needed for dashboard stats
    const [
      { data: affiliates, error: affiliatesError },
      { data: referrals, error: referralsError },
      { data: programs, error: programsError }
    ] = await Promise.all([
      authenticatedSupabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id),
      authenticatedSupabase
        .from('referrals')
        .select(`
          *,
          affiliates (
            id,
            name,
            email
          ),
          programs (
            id,
            name,
            commission,
            commission_type,
            type
          )
        `)
        .eq('user_id', user.id),
      authenticatedSupabase
        .from('programs')
        .select('*')
        .eq('user_id', user.id)
    ]);

    if (affiliatesError || referralsError || programsError) {
      console.error('Error fetching dashboard data:', { affiliatesError, referralsError, programsError });
      return NextResponse.json(
        { success: false, message: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }

    // Calculate stats
    const totalAffiliates = affiliates?.length || 0;
    const activeAffiliates = affiliates?.filter(a => a.status === 'active').length || 0;
    const totalReferrals = referrals?.length || 0;
    const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
    const approvedReferrals = referrals?.filter(r => r.status === 'approved').length || 0;

    // Calculate total earnings based on approved referrals and program commission rates
    let totalEarnings = 0;
    if (referrals && programs) {
      const approvedReferralsWithPrograms = referrals.filter(r => r.status === 'approved');
      
      approvedReferralsWithPrograms.forEach(referral => {
        const program = referral.programs;
        if (program) {
          if (program.commission_type === 'fixed') {
            totalEarnings += program.commission;
          } else if (program.commission_type === 'percentage') {
            // For percentage, we need a base amount - using a default of 100 for now
            // In a real scenario, this would be the actual transaction amount
            totalEarnings += (program.commission / 100) * 100; // Default base amount
          }
        }
      });
    }

    // Get recent activity (last 10 referrals)
    const recentActivity = referrals
      ?.slice(0, 10)
      .map(referral => ({
        id: referral.id,
        type: 'referral',
        description: `New referral from ${referral.affiliates?.name || 'Unknown'} for ${referral.customer_name}`,
        amount: referral.commission,
        status: referral.status,
        created_at: referral.created_at,
        customer_email: referral.customer_email
      })) || [];

    // Calculate percentage changes (comparing to previous month)
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthReferrals = referrals?.filter(r => 
      new Date(r.created_at) >= currentMonth
    ).length || 0;

    const previousMonthReferrals = referrals?.filter(r => 
      new Date(r.created_at) >= previousMonth && new Date(r.created_at) < currentMonth
    ).length || 0;

    const referralChange = previousMonthReferrals > 0 
      ? ((currentMonthReferrals - previousMonthReferrals) / previousMonthReferrals * 100).toFixed(1)
      : currentMonthReferrals > 0 ? '+100' : '0';

    const stats = {
      totalAffiliates,
      activeAffiliates,
      totalReferrals,
      pendingReferrals,
      approvedReferrals,
      totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
      pendingPayouts: Math.round(totalEarnings * 100) / 100, // Same as total earnings for now
      referralChange: referralChange.startsWith('+') ? `+${referralChange}%` : `${referralChange}%`
    };

    return NextResponse.json({ 
      success: true, 
      stats,
      recentActivity
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 