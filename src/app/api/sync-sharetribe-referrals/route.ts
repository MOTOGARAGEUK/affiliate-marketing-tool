import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Sharetribe Integration API client
class SharetribeAPI {
  private baseUrl: string;
  private accessToken: string;

  constructor() {
    this.baseUrl = process.env.SHARETRIBE_API_URL || 'https://flex-api.sharetribe.com/v1';
    this.accessToken = process.env.SHARETRIBE_ACCESS_TOKEN || '';
  }

  async queryUsers(filters: any = {}) {
    const response = await fetch(`${this.baseUrl}/users/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        filters,
        include: ['profile'],
        fields: {
          user: ['id', 'profile', 'createdAt', 'publicData'],
          profile: ['displayName', 'abbreviatedName', 'bio']
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Sharetribe API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async queryTransactions(filters: any = {}) {
    const response = await fetch(`${this.baseUrl}/transactions/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        filters,
        include: ['listing', 'customer', 'provider'],
        fields: {
          transaction: ['id', 'createdAt', 'lastTransitionedAt', 'totalPrice', 'state'],
          listing: ['id', 'title', 'price'],
          customer: ['id', 'profile'],
          provider: ['id', 'profile']
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Sharetribe API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== SHARETRIBE REFERRAL SYNC ===');
    
    const body = await request.json();
    const { syncType = 'all', userId } = body; // 'users', 'transactions', or 'all'
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const sharetribeAPI = new SharetribeAPI();
    
    let results = {
      usersProcessed: 0,
      transactionsProcessed: 0,
      referralsCreated: 0,
      errors: []
    };

    // Sync new users (signups)
    if (syncType === 'all' || syncType === 'users') {
      console.log('🔄 Syncing users...');
      
      try {
        // Get users created in the last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const usersResponse = await sharetribeAPI.queryUsers({
          createdAt: {
            $gte: yesterday.toISOString()
          }
        });

        console.log(`Found ${usersResponse.data?.length || 0} recent users`);

        for (const user of usersResponse.data || []) {
          try {
            // First, try to find UTM data for this user
            const { data: utmData, error: utmError } = await supabase
              .from('utm_tracking')
              .select('*')
              .eq('sharetribe_user_id', user.id)
              .eq('processed', false)
              .order('created_at', { ascending: false })
              .limit(1);

            if (utmError) {
              console.error('Error querying UTM data:', utmError);
            }

            // Check if user has referral data in publicData (fallback)
            const referralCode = user.attributes?.publicData?.referralCode || utmData?.[0]?.utm_campaign;
            const utmSource = user.attributes?.publicData?.utmSource || utmData?.[0]?.utm_source;
            const utmCampaign = user.attributes?.publicData?.utmCampaign || utmData?.[0]?.utm_campaign;
            
            console.log(`Processing user ${user.id}:`, { referralCode, utmSource, utmCampaign });
            
            // Only process if this is an affiliate referral
            if (utmSource === 'affiliate' && utmCampaign) {
              // Find the affiliate by referral code
              const { data: affiliate, error: affiliateError } = await supabase
                .from('affiliates')
                .select(`
                  id,
                  user_id,
                  name as affiliate_name,
                  email as affiliate_email,
                  programs (
                    id,
                    name,
                    commission,
                    commission_type,
                    type
                  )
                `)
                .eq('referral_code', utmCampaign)
                .single();

              if (affiliateError || !affiliate) {
                console.log(`❌ Affiliate not found for referral code: ${utmCampaign}`);
                results.errors.push(`Affiliate not found for code: ${utmCampaign}`);
                continue;
              }

              // Check if this customer has already been tracked
              const { data: existingReferral } = await supabase
                .from('referrals')
                .select('id')
                .eq('affiliate_id', affiliate.id)
                .eq('customer_email', user.attributes?.profile?.email || '')
                .maybeSingle();

              if (existingReferral) {
                console.log(`Customer already tracked for affiliate: ${affiliate.affiliate_name}`);
                continue;
              }

              // Create referral record
              const { error: referralError } = await supabase
                .from('referrals')
                .insert({
                  user_id: affiliate.user_id,
                  affiliate_id: affiliate.id,
                  customer_email: user.attributes?.profile?.email || '',
                  customer_name: user.attributes?.profile?.displayName || 'Unknown',
                  signup_date: user.attributes?.createdAt,
                  listings_count: 1,
                  purchases_count: 0,
                  total_revenue: 0,
                  status: 'pending',
                  commission_earned: 0
                });

              if (referralError) {
                console.error('❌ Error creating referral:', referralError);
                results.errors.push(`Error creating referral: ${referralError.message}`);
              } else {
                console.log(`✅ Referral created for user: ${user.id}`);
                results.referralsCreated++;
                
                // Mark UTM data as processed
                if (utmData?.[0]) {
                  await supabase
                    .from('utm_tracking')
                    .update({ processed: true, sharetribe_user_id: user.id })
                    .eq('id', utmData[0].id);
                }
              }
            }
            
            results.usersProcessed++;
          } catch (userError) {
            console.error(`❌ Error processing user ${user.id}:`, userError);
            results.errors.push(`User ${user.id}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
          }
        }
      } catch (usersError) {
        console.error('❌ Error querying users:', usersError);
        results.errors.push(`Users query error: ${usersError instanceof Error ? usersError.message : 'Unknown error'}`);
      }
    }

    // Sync transactions (purchases)
    if (syncType === 'all' || syncType === 'transactions') {
      console.log('🔄 Syncing transactions...');
      
      try {
        // Get transactions from the last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const transactionsResponse = await sharetribeAPI.queryTransactions({
          createdAt: {
            $gte: yesterday.toISOString()
          },
          state: 'confirmed' // Only confirmed transactions
        });

        console.log(`Found ${transactionsResponse.data?.length || 0} recent transactions`);

        for (const transaction of transactionsResponse.data || []) {
          try {
            // Check if transaction has referral data
            const referralCode = transaction.attributes?.publicData?.referralCode;
            const utmSource = transaction.attributes?.publicData?.utmSource;
            const utmCampaign = transaction.attributes?.publicData?.utmCampaign;
            
            console.log(`Processing transaction ${transaction.id}:`, { referralCode, utmSource, utmCampaign });
            
            // Only process if this is an affiliate referral
            if (utmSource === 'affiliate' && utmCampaign) {
              // Find the affiliate by referral code
              const { data: affiliate, error: affiliateError } = await supabase
                .from('affiliates')
                .select(`
                  id,
                  user_id,
                  name as affiliate_name,
                  email as affiliate_email,
                  programs (
                    id,
                    name,
                    commission,
                    commission_type,
                    type
                  )
                `)
                .eq('referral_code', utmCampaign)
                .single();

              if (affiliateError || !affiliate) {
                console.log(`❌ Affiliate not found for referral code: ${utmCampaign}`);
                results.errors.push(`Affiliate not found for code: ${utmCampaign}`);
                continue;
              }

              // Find existing referral for this customer
              const { data: existingReferral, error: referralError } = await supabase
                .from('referrals')
                .select('*')
                .eq('affiliate_id', affiliate.id)
                .eq('customer_email', transaction.relationships?.customer?.data?.id || '')
                .maybeSingle();

              if (referralError) {
                console.error('❌ Error finding referral:', referralError);
                results.errors.push(`Error finding referral: ${referralError.message}`);
                continue;
              }

              if (!existingReferral) {
                console.log(`No existing referral found for transaction: ${transaction.id}`);
                results.errors.push(`No referral found for transaction: ${transaction.id}`);
                continue;
              }

              // Calculate commission
              const program = affiliate.programs[0];
              const transactionValue = transaction.attributes?.totalPrice?.amount || 0;
              let commissionEarned = 0;
              
              if (program.commission_type === 'percentage') {
                commissionEarned = (transactionValue * program.commission) / 100;
              } else {
                commissionEarned = program.commission;
              }

              // Update referral with purchase information
              const { error: updateError } = await supabase
                .from('referrals')
                .update({
                  purchases_count: existingReferral.purchases_count + 1,
                  total_revenue: existingReferral.total_revenue + transactionValue,
                  commission_earned: existingReferral.commission_earned + commissionEarned,
                  status: 'approved'
                })
                .eq('id', existingReferral.id);

              if (updateError) {
                console.error('❌ Error updating referral:', updateError);
                results.errors.push(`Error updating referral: ${updateError.message}`);
              } else {
                console.log(`✅ Purchase referral updated for transaction: ${transaction.id}`);
                results.referralsCreated++;
              }
            }
            
            results.transactionsProcessed++;
          } catch (transactionError) {
            console.error(`❌ Error processing transaction ${transaction.id}:`, transactionError);
            results.errors.push(`Transaction ${transaction.id}: ${transactionError instanceof Error ? transactionError.message : 'Unknown error'}`);
          }
        }
      } catch (transactionsError) {
        console.error('❌ Error querying transactions:', transactionsError);
        results.errors.push(`Transactions query error: ${transactionsError instanceof Error ? transactionsError.message : 'Unknown error'}`);
      }
    }

    console.log('=== SYNC RESULTS ===');
    console.log('Users processed:', results.usersProcessed);
    console.log('Transactions processed:', results.transactionsProcessed);
    console.log('Referrals created/updated:', results.referralsCreated);
    console.log('Errors:', results.errors);
    console.log('=== END SHARETRIBE REFERRAL SYNC ===');

    return NextResponse.json({
      success: true,
      message: 'Sharetribe referral sync completed',
      results
    });

  } catch (error) {
    console.error('❌ Sharetribe referral sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync referrals',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 