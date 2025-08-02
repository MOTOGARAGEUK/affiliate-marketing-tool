import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSharetribeCredentials, createSharetribeAPI } from '@/lib/sharetribe';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    // Get all referrals with ShareTribe user IDs
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, user_id, customer_email, sharetribe_user_id, listings_count, transactions_count, total_revenue, last_sync_at')
      .not('customer_email', 'is', null);

    if (referralsError) {
      return NextResponse.json({ success: false, message: 'Error fetching referrals', error: referralsError.message }, { status: 500 });
    }

    if (!referrals || referrals.length === 0) {
      return NextResponse.json({ success: false, message: 'No referrals with customer emails found' });
    }

    console.log('🔍 Found referrals:', referrals);

    // Get ShareTribe credentials
    const credentials = await getSharetribeCredentials(authUser.id);
    if (!credentials) {
      return NextResponse.json({ success: false, message: 'No ShareTribe credentials found' }, { status: 400 });
    }

    const sharetribeAPI = createSharetribeAPI(credentials);

    // Test each referral's customer email
    const debugResults = [];

    for (const referral of referrals) {
      console.log(`🔍 Testing referral ${referral.id} with customer email: ${referral.customer_email}`);
      
      try {
        // Test if user exists in ShareTribe by email
        const user = await sharetribeAPI.getUserByEmail(referral.customer_email);
        
        if (!user) {
          debugResults.push({
            referralId: referral.id,
            customerEmail: referral.customer_email,
            sharetribeUserId: referral.sharetribe_user_id,
            status: 'User not found in ShareTribe',
            error: 'Email does not exist in ShareTribe marketplace'
          });
          continue;
        }

        // Test getUserStats
        const stats = await sharetribeAPI.getUserStats(user.id);
        
        debugResults.push({
          referralId: referral.id,
          customerEmail: referral.customer_email,
          sharetribeUserId: referral.sharetribe_user_id,
          status: 'Success',
          user: {
            id: user.id,
            email: user.email,
            displayName: user.profile?.displayName
          },
          stats: stats ? {
            listingsCount: stats.listingsCount,
            transactionsCount: stats.transactionsCount,
            totalRevenue: stats.totalRevenue
          } : null,
          error: stats ? null : 'getUserStats returned null'
        });

      } catch (error) {
        debugResults.push({
          referralId: referral.id,
          customerEmail: referral.customer_email,
          sharetribeUserId: referral.sharetribe_user_id,
          status: 'Error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Debug sync failure completed',
      totalReferrals: referrals.length,
      debugResults
    });

  } catch (error) {
    console.error('❌ Error in debug sync failure:', error);
    return NextResponse.json({
      success: false,
      message: 'Debug sync failure failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 