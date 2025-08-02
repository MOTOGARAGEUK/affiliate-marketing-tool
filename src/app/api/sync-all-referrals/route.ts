import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSharetribeCredentials, createSharetribeAPI } from '@/lib/sharetribe';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting comprehensive sync of all referrals...');

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all referrals with customer emails
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, user_id, customer_email, sharetribe_user_id, listings_count, transactions_count, total_revenue, last_sync_at')
      .not('customer_email', 'is', null);

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { success: false, message: 'Error fetching referrals' },
        { status: 500 }
      );
    }

    if (!referrals || referrals.length === 0) {
      console.log('No referrals with customer emails found');
      return NextResponse.json({
        success: true,
        message: 'No referrals to sync',
        syncedCount: 0,
        updatedCount: 0
      });
    }

    console.log(`Found ${referrals.length} referrals to sync`);

    // Get ShareTribe credentials (using the first referral's user_id)
    const firstReferral = referrals[0];
    const credentials = await getSharetribeCredentials(firstReferral.user_id);
    if (!credentials) {
      return NextResponse.json(
        { success: false, message: 'No ShareTribe credentials found' },
        { status: 400 }
      );
    }

    const sharetribeAPI = createSharetribeAPI(credentials);

    let syncedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];
    const results: any[] = [];

    // Process each referral by email
    for (const referral of referrals) {
      try {
        console.log(`🔍 Processing referral ${referral.id} for email: ${referral.customer_email}`);

        // Step 1: Get user by email from ShareTribe
        console.log(`📧 Looking up user by email: ${referral.customer_email}`);
        const user = await sharetribeAPI.getUserByEmail(referral.customer_email);
        
        if (!user) {
          console.log(`❌ User not found in ShareTribe: ${referral.customer_email}`);
          console.log(`❌ This email does not exist in the ShareTribe marketplace`);
          errors.push(`User not found in ShareTribe: ${referral.customer_email}`);
          results.push({
            referralId: referral.id,
            email: referral.customer_email,
            status: 'User not found',
            error: 'Email not found in ShareTribe marketplace'
          });
          continue;
        }

        console.log(`✅ Found user in ShareTribe: ${user.id} (${user.email})`);
        console.log(`✅ User details: ${user.profile?.displayName || 'No display name'}`);

        // Step 2: Get user's listings using documented endpoint
        console.log(`📋 Getting listings for user: ${user.id}`);
        const listings = await sharetribeAPI.getUserListings(user.id, 1000);
        console.log(`📋 Found ${listings.length} listings for user: ${user.id}`);
        console.log(`📋 Listings details:`, listings.map(l => ({ id: l.id, state: l.attributes.state, title: l.attributes.title })));

        // Step 3: Get user's transactions using documented endpoint
        console.log(`💰 Getting transactions for user: ${user.id}`);
        const transactions = await sharetribeAPI.getUserTransactions(user.id, 1000);
        console.log(`💰 Found ${transactions.length} transactions for user: ${user.id}`);

        // Step 4: Calculate stats
        const activeListings = listings.filter(listing => {
          const state = listing.attributes?.state || listing.state;
          return state === 'published' || state === 'active';
        });

        const completedTransactions = transactions.filter(transaction => {
          const lastTransition = transaction.attributes?.lastTransition || transaction.lastTransition;
          return lastTransition === 'confirmed' || lastTransition === 'completed';
        });

        // Calculate total revenue
        let totalRevenue = 0;
        let currency = 'USD';
        
        completedTransactions.forEach(transaction => {
          const totalPrice = transaction.attributes?.totalPrice || transaction.totalPrice;
          if (totalPrice && totalPrice.amount) {
            totalRevenue += totalPrice.amount;
            currency = totalPrice.currency || currency;
          }
        });

        const stats = {
          userId: user.id,
          createdAt: user.createdAt || user.attributes?.createdAt || new Date().toISOString(),
          listingsCount: activeListings.length,
          transactionsCount: completedTransactions.length,
          totalRevenue: totalRevenue,
          currency: currency
        };

        console.log(`📊 Calculated stats for ${referral.customer_email}:`, stats);

        // Step 5: Check if data has changed
        const hasChanged = 
          stats.listingsCount !== referral.listings_count ||
          stats.transactionsCount !== referral.transactions_count ||
          stats.totalRevenue !== referral.total_revenue ||
          user.id !== referral.sharetribe_user_id;

        if (hasChanged) {
          console.log(`🔄 Data changed for referral ${referral.id}:`, {
            old: {
              sharetribeUserId: referral.sharetribe_user_id,
              listings: referral.listings_count,
              transactions: referral.transactions_count,
              revenue: referral.total_revenue
            },
            new: {
              sharetribeUserId: user.id,
              listings: stats.listingsCount,
              transactions: stats.transactionsCount,
              revenue: stats.totalRevenue
            }
          });

          // Update the referral with new data
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
            .eq('id', referral.id);

          if (updateError) {
            console.error(`❌ Error updating referral ${referral.id}:`, updateError);
            errors.push(`Error updating referral ${referral.id}: ${updateError.message}`);
          } else {
            updatedCount++;
            console.log(`✅ Updated referral ${referral.id} with new data`);
          }
        } else {
          console.log(`✅ No changes for referral ${referral.id}`);
        }

        syncedCount++;
        results.push({
          referralId: referral.id,
          email: referral.customer_email,
          status: 'Success',
          user: {
            id: user.id,
            email: user.email,
            displayName: user.profile?.displayName
          },
          stats: stats,
          listings: listings.length,
          transactions: transactions.length,
          updated: hasChanged
        });

      } catch (referralError) {
        console.error(`❌ Error processing referral ${referral.id}:`, referralError);
        errors.push(`Error processing referral ${referral.id}: ${referralError instanceof Error ? referralError.message : 'Unknown error'}`);
        results.push({
          referralId: referral.id,
          email: referral.customer_email,
          status: 'Error',
          error: referralError instanceof Error ? referralError.message : 'Unknown error'
        });
      }
    }

    console.log(`🔄 Comprehensive sync completed. Synced: ${syncedCount}, Updated: ${updatedCount}, Errors: ${errors.length}`);

    // Determine overall success based on whether we found any users
    const foundUsers = results.filter(r => r.status === 'Success').length;
    const notFoundUsers = results.filter(r => r.status === 'User not found').length;
    const errorUsers = results.filter(r => r.status === 'Error').length;

    const overallSuccess = foundUsers > 0; // Success if we found at least one user

    // Log detailed results to console
    console.log('📊 SYNC RESULTS SUMMARY:');
    console.log(`Total Referrals: ${referrals.length}`);
    console.log(`Users Found: ${foundUsers}`);
    console.log(`Users Not Found: ${notFoundUsers}`);
    console.log(`Errors: ${errorUsers}`);
    console.log('📋 DETAILED RESULTS:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. Referral ${result.referralId}:`);
      console.log(`   Email: ${result.email}`);
      console.log(`   Status: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.user) {
        console.log(`   User: ${result.user.displayName} (${result.user.email})`);
      }
      if (result.stats) {
        console.log(`   Stats: ${result.stats.listingsCount} listings, ${result.stats.transactionsCount} transactions, $${result.stats.totalRevenue}`);
      }
    });

    if (errors.length > 0) {
      console.log('❌ ERRORS:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? 'Comprehensive sync completed successfully' : 'Sync completed but no users found in ShareTribe',
      syncedCount,
      updatedCount,
      errorCount: errors.length,
      summary: {
        totalReferrals: referrals.length,
        usersFound: foundUsers,
        usersNotFound: notFoundUsers,
        errors: errorUsers
      },
      errors: errors.length > 0 ? errors : undefined,
      details: {
        totalReferrals: referrals.length,
        results: results
      }
    });

  } catch (error) {
    console.error('❌ Error in comprehensive sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error in comprehensive sync',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 