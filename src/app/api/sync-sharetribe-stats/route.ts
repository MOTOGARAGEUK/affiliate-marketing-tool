import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralId, userEmail } = body;

    if (!referralId || !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Missing referralId or userEmail' },
        { status: 400 }
      );
    }

    console.log('🔄 Syncing ShareTribe stats for referral:', referralId, 'user:', userEmail);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the user ID from the referral
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('user_id')
      .eq('id', referralId)
      .single();

    if (referralError || !referral) {
      console.error('Error fetching referral:', referralError);
      return NextResponse.json(
        { success: false, message: 'Referral not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found referral for user:', referral.user_id);

    // Get ShareTribe credentials from database
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(referral.user_id);

    if (!credentials) {
      console.error('No ShareTribe credentials found for user:', referral.user_id);
      return NextResponse.json(
        { success: false, message: 'ShareTribe integration not configured' },
        { status: 400 }
      );
    }

    console.log('✅ Found ShareTribe credentials for user:', referral.user_id);

    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI(credentials);

    // Get user by email
    const user = await sharetribeAPI.getUserByEmail(userEmail);
    if (!user) {
      console.log('❌ User not found in ShareTribe:', userEmail);
      return NextResponse.json(
        { success: false, message: 'User not found in ShareTribe' },
        { status: 404 }
      );
    }

    console.log('✅ Found user in ShareTribe:', user.id);

    // Get comprehensive user stats
    const stats = await sharetribeAPI.getUserStats(user.id);
    if (!stats) {
      console.log('❌ Could not fetch user stats for:', user.id);
      return NextResponse.json(
        { success: false, message: 'Could not fetch user stats' },
        { status: 500 }
      );
    }

    console.log('📊 User stats fetched:', stats);

    // Update referral record with ShareTribe data
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        sharetribe_user_id: user.id,
        sharetribe_created_at: stats.createdAt,
        listings_count: stats.listingsCount,
        transactions_count: stats.transactionsCount,
        total_revenue: stats.totalRevenue,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', referralId);

    if (updateError) {
      console.error('❌ Error updating referral with ShareTribe stats:', updateError);
      return NextResponse.json(
        { success: false, message: 'Error updating referral stats' },
        { status: 500 }
      );
    }

    console.log('✅ ShareTribe user stats updated successfully for referral:', referralId);

    return NextResponse.json({
      success: true,
      message: 'ShareTribe stats synced successfully',
      stats: {
        userId: user.id,
        createdAt: stats.createdAt,
        listingsCount: stats.listingsCount,
        transactionsCount: stats.transactionsCount,
        totalRevenue: stats.totalRevenue,
        currency: stats.currency
      }
    });

  } catch (error) {
    console.error('❌ Error syncing ShareTribe stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error syncing ShareTribe stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 