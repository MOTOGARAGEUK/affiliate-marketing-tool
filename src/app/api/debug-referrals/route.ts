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

    console.log('🔍 Debugging referrals for user:', user.id);

    // Check affiliates first
    const { data: affiliates, error: affiliatesError } = await authenticatedSupabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id);

    if (affiliatesError) {
      console.error('Error fetching affiliates:', affiliatesError);
      return NextResponse.json(
        { success: false, message: 'Error fetching affiliates' },
        { status: 500 }
      );
    }

    console.log('📊 Found affiliates:', affiliates?.length || 0);

    // Check referrals
    const { data: referrals, error: referralsError } = await authenticatedSupabase
      .from('referrals')
      .select('*')
      .eq('user_id', user.id);

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { success: false, message: 'Error fetching referrals' },
        { status: 500 }
      );
    }

    console.log('📊 Found referrals:', referrals?.length || 0);

    // Check all referrals in the system (for debugging)
    const { data: allReferrals, error: allReferralsError } = await authenticatedSupabase
      .from('referrals')
      .select('*');

    if (allReferralsError) {
      console.error('Error fetching all referrals:', allReferralsError);
    } else {
      console.log('📊 Total referrals in system:', allReferrals?.length || 0);
    }

    // Check recent track-referral API calls
    const { data: apiLogs, error: apiLogsError } = await authenticatedSupabase
      .from('api_logs')
      .select('*')
      .eq('endpoint', 'track-referral')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ 
      success: true, 
      debug: {
        userId: user.id,
        userEmail: user.email,
        affiliatesCount: affiliates?.length || 0,
        userReferralsCount: referrals?.length || 0,
        totalReferralsInSystem: allReferrals?.length || 0,
        affiliates: affiliates?.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          referral_code: a.referral_code,
          referral_link: a.referral_link,
          status: a.status
        })) || [],
        userReferrals: referrals || [],
        recentApiLogs: apiLogs || []
      }
    });
  } catch (error) {
    console.error('Failed to debug referrals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to debug referrals' },
      { status: 500 }
    );
  }
} 