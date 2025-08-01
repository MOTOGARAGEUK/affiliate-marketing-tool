import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting sync of all referrals for live updates...');

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all referrals that have ShareTribe user IDs
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, user_id, customer_email, sharetribe_user_id, listings_count, transactions_count, total_revenue, last_sync_at')
      .not('sharetribe_user_id', 'is', null);

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { success: false, message: 'Error fetching referrals' },
        { status: 500 }
      );
    }

    if (!referrals || referrals.length === 0) {
      console.log('No referrals with ShareTribe user IDs found');
      return NextResponse.json({
        success: true,
        message: 'No referrals to sync',
        syncedCount: 0,
        updatedCount: 0
      });
    }

    console.log(`Found ${referrals.length} referrals to sync`);

    let syncedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Group referrals by user_id to avoid creating multiple API instances
    const referralsByUser = referrals.reduce((acc, referral) => {
      if (!acc[referral.user_id]) {
        acc[referral.user_id] = [];
      }
      acc[referral.user_id].push(referral);
      return acc;
    }, {} as Record<string, typeof referrals>);

    // Process each user's referrals
    for (const [userId, userReferrals] of Object.entries(referralsByUser)) {
      try {
        console.log(`Processing referrals for user: ${userId}`);

        // Get ShareTribe credentials for this user
        const { getSharetribeCredentials, createSharetribeAPI } = await import('@/lib/sharetribe');
        const credentials = await getSharetribeCredentials(userId);

        if (!credentials) {
          console.log(`No ShareTribe credentials found for user: ${userId}`);
          errors.push(`No ShareTribe credentials for user ${userId}`);
          continue;
        }

        const sharetribeAPI = createSharetribeAPI(credentials);

        // Process each referral for this user
        for (const referral of userReferrals) {
          try {
            console.log(`Syncing referral: ${referral.id} for user: ${referral.customer_email}`);

            // Get current user stats from ShareTribe
            const stats = await sharetribeAPI.getUserStats(referral.sharetribe_user_id);
            
            if (!stats) {
              console.log(`Could not fetch stats for referral: ${referral.id}`);
              errors.push(`Could not fetch stats for referral ${referral.id}`);
              continue;
            }

            // Check if data has changed
            const hasChanged = 
              stats.listingsCount !== referral.listings_count ||
              stats.transactionsCount !== referral.transactions_count ||
              stats.totalRevenue !== referral.total_revenue;

            if (hasChanged) {
              console.log(`Data changed for referral ${referral.id}:`, {
                old: {
                  listings: referral.listings_count,
                  transactions: referral.transactions_count,
                  revenue: referral.total_revenue
                },
                new: {
                  listings: stats.listingsCount,
                  transactions: stats.transactionsCount,
                  revenue: stats.totalRevenue
                }
              });

              // Update the referral with new data
              const { error: updateError } = await supabase
                .from('referrals')
                .update({
                  listings_count: stats.listingsCount,
                  transactions_count: stats.transactionsCount,
                  total_revenue: stats.totalRevenue,
                  last_sync_at: new Date().toISOString()
                })
                .eq('id', referral.id);

              if (updateError) {
                console.error(`Error updating referral ${referral.id}:`, updateError);
                errors.push(`Error updating referral ${referral.id}: ${updateError.message}`);
              } else {
                updatedCount++;
                console.log(`✅ Updated referral ${referral.id} with new data`);
              }
            } else {
              console.log(`No changes for referral ${referral.id}`);
            }

            syncedCount++;

          } catch (referralError) {
            console.error(`Error syncing referral ${referral.id}:`, referralError);
            errors.push(`Error syncing referral ${referral.id}: ${referralError instanceof Error ? referralError.message : 'Unknown error'}`);
          }
        }

      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
        errors.push(`Error processing user ${userId}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
      }
    }

    console.log(`🔄 Sync completed. Synced: ${syncedCount}, Updated: ${updatedCount}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      message: 'Live sync completed',
      syncedCount,
      updatedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      details: {
        totalReferrals: referrals.length,
        processedUsers: Object.keys(referralsByUser).length,
        errors: errors
      }
    });

  } catch (error) {
    console.error('❌ Error in live sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error in live sync',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 