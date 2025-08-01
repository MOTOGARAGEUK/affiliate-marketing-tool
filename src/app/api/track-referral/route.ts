import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    console.log('=== REFERRAL TRACKING DEBUG ===');
    console.log('Request received at:', new Date().toISOString());
    
    const body = await request.json();
    console.log('Request body:', body);
    
    let { 
      action, // 'page_view', 'form_submit', 'signup_click', 'signup_complete'
      referralCode, 
      email,
      userInfo,
      page,
      timestamp
    } = body;

    // Handle different tracking actions
    if (action === 'page_view') {
      console.log('📄 Page view tracked:', { referralCode, page });
      return NextResponse.json(
        { success: true, message: 'Page view tracked' },
        { 
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    if (action === 'signup_click') {
      console.log('🖱️ Signup click tracked:', { referralCode });
      return NextResponse.json(
        { success: true, message: 'Signup click tracked' },
        { 
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    if (action === 'form_submit') {
      console.log('📝 Form submission tracked:', { referralCode, email });
      return NextResponse.json(
        { success: true, message: 'Form submission tracked' },
        { 
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    if (action === 'signup_initiated') {
      console.log('🚀 Signup initiated tracked:', { referralCode, email });
      return NextResponse.json(
        { success: true, message: 'Signup initiated tracked' },
        { 
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Handle signup completion
    if (action === 'signup_complete') {
      console.log('✅ Signup completion tracked:', { referralCode, userInfo });
      
      const customerEmail = userInfo?.email || email;
      const customerName = userInfo?.name || 'Unknown User';
      
      if (!customerEmail) {
        console.log('❌ No email provided for signup completion');
        return NextResponse.json(
          { success: false, message: 'No email provided' },
          { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }
      
      // Process the signup completion
      const result = await processSignupCompletion(referralCode, customerEmail, customerName);
      
          // Also try to update Sharetribe user metadata
    if (result && typeof result === 'object' && 'success' in result && result.success) {
      try {
        await updateSharetribeUserMetadata(customerEmail, referralCode);
      } catch (metadataError) {
        console.error('❌ Error updating Sharetribe metadata:', metadataError);
        // Don't fail the whole request if metadata update fails
      }
    }
      
      return result;
    }

    // Legacy support for old format
    let { 
      customerEmail, 
      customerName, 
      amount = 0,
      listingsCount = 0
    } = body;

    // If no referral code provided in body, try to get it from cookies
    if (!referralCode) {
      console.log('No referral code in body, checking cookies...');
      const cookieHeader = request.headers.get('cookie');
      console.log('Cookie header:', cookieHeader);
      
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);

        referralCode = cookies.referralCode;
        console.log('Found referral code in cookies:', referralCode);
      } else {
        console.log('No cookie header found');
      }
    } else {
      console.log('Referral code provided in body:', referralCode);
    }

    if (!customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!referralCode) {
      return NextResponse.json(
        { success: false, message: 'No referral code provided' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find the affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select(`
        id,
        user_id,
        name,
        referral_code,
        program_id
      `)
      .eq('referral_code', referralCode)
      .single();

    if (affiliateError || !affiliate) {
      console.log('❌ Referral code not found in database:', referralCode);
      console.log('Affiliate error:', affiliateError);
      console.log('=== END REFERRAL TRACKING DEBUG ===');
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 404 }
      );
    }

    console.log('✅ Found affiliate:', affiliate.name);

    // Check if this customer has already been tracked for this affiliate
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('customer_email', customerEmail.toLowerCase().trim())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing referral:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking referral' },
        { status: 500 }
      );
    }

    if (existingReferral) {
      console.log('Customer already tracked for this affiliate');
      return NextResponse.json(
        { success: false, message: 'Customer already tracked' },
        { status: 409 }
      );
    }

    // For now, use a fixed commission for signups
    let commissionEarned = 10.00; // Default $10 commission
    let status = 'approved'; // Signups are typically auto-approved

    // Create the referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        user_id: affiliate.user_id,
        affiliate_id: affiliate.id,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_name: customerName,
        signup_date: new Date().toISOString(),
        listings_count: action === 'signup' ? listingsCount : 0,
        purchases_count: action === 'purchase' ? 1 : 0,
        total_revenue: action === 'purchase' ? amount : 0,
        status: status,
        commission: commissionEarned
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating referral:', referralError);
      return NextResponse.json(
        { success: false, message: 'Error creating referral' },
        { status: 500 }
      );
    }

    console.log('✅ Referral tracked successfully:', {
              affiliate: affiliate.name,
      customer: customerName,
      action: action,
      commission: commissionEarned
    });

    // Automatically sync ShareTribe stats for the new referral
    console.log('🔄 Starting automatic ShareTribe sync for new referral...');
    try {
      const syncResult = await updateSharetribeUserStats(customerEmail, referral.id);
      if (syncResult) {
        console.log('✅ Automatic ShareTribe sync completed successfully');
      } else {
        console.log('⚠️ Automatic ShareTribe sync failed, but referral was created');
      }
    } catch (syncError) {
      console.error('❌ Error during automatic ShareTribe sync:', syncError);
      // Don't fail the referral creation if sync fails
    }

    console.log('=== END REFERRAL TRACKING DEBUG ===');

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        affiliate_name: affiliate.name,
        customer_name: customerName,
        action: action,
        commission: commissionEarned,
        status: status
      }
    });

  } catch (error) {
    console.error('Failed to track referral:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to track referral',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Helper function to process signup completion
async function processSignupCompletion(referralCode: string, customerEmail: string, customerName: string) {
  console.log('Processing signup completion for:', { referralCode, customerEmail, customerName });

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select(`
        id,
        user_id,
        name,
        referral_code,
        program_id
      `)
      .eq('referral_code', referralCode)
      .single();

    if (affiliateError || !affiliate) {
      console.log('❌ Referral code not found in database:', referralCode);
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 404 }
      );
    }

    console.log('✅ Found affiliate:', affiliate.name);

    // Check if this customer has already been tracked for this affiliate
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('customer_email', customerEmail.toLowerCase().trim())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing referral:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking referral' },
        { status: 500 }
      );
    }

    if (existingReferral) {
      console.log('Customer already tracked for this affiliate');
      return NextResponse.json(
        { success: false, message: 'Customer already tracked' },
        { status: 409 }
      );
    }

    // For now, use a fixed commission for signups
    let commissionEarned = 10.00; // Default $10 commission
    let status = 'approved'; // Signups are typically auto-approved

    // Create the referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        user_id: affiliate.user_id,
        affiliate_id: affiliate.id,
        program_id: affiliate.program_id,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_name: customerName,
        status: status,
        commission: commissionEarned,
        referral_code: referralCode
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating referral:', referralError);
      return NextResponse.json(
        { success: false, message: 'Error creating referral' },
        { status: 500 }
      );
    }

    // Update affiliate stats
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // Get current affiliate stats first
      const { data: currentAffiliate } = await supabaseAdmin
        .from('affiliates')
        .select('total_referrals, total_earnings')
        .eq('id', affiliate.id)
        .single();
      
      if (currentAffiliate) {
        await supabaseAdmin
          .from('affiliates')
          .update({
            total_referrals: (currentAffiliate.total_referrals || 0) + 1,
            total_earnings: (currentAffiliate.total_earnings || 0) + commissionEarned
          })
          .eq('id', affiliate.id);
      }
    } catch (updateError) {
      console.error('Error updating affiliate stats:', updateError);
      // Don't fail the whole request if stats update fails
    }

    // Send notification to affiliate
    try {
      const notificationResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/notify-affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          referralId: referral.id,
          customerEmail: customerEmail,
          customerName: customerName,
          notificationType: 'new_referral'
        })
      });

      if (notificationResponse.ok) {
        console.log('✅ Affiliate notification sent');
      } else {
        console.log('⚠️ Affiliate notification failed');
      }
    } catch (notificationError) {
      console.error('❌ Error sending affiliate notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        affiliate_name: affiliate.name,
        customer_name: customerName,
        commission: commissionEarned,
        status: status
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('Failed to process signup completion:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process signup completion',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Helper function to update Sharetribe user metadata
async function updateSharetribeUserMetadata(userEmail: string, referralCode: string) {
  console.log('🔄 Updating Sharetribe user metadata:', { userEmail, referralCode });

  try {
    // Get the user ID from the referral code
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: referral, error: referralError } = await supabaseClient
      .from('referrals')
      .select('user_id')
      .eq('referral_code', referralCode)
      .single();

    if (referralError || !referral) {
      console.log('❌ Referral not found for code:', referralCode);
      return false;
    }

    // Get ShareTribe credentials from database
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(referral.user_id);

    if (!credentials) {
      console.log('No ShareTribe credentials found for user:', referral.user_id);
      return false;
    }

    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI(credentials);

    const user = await sharetribeAPI.getUserByEmail(userEmail);

    if (!user) {
      console.log('❌ User not found in Sharetribe:', userEmail);
      return false;
    }

    console.log('✅ Found user in Sharetribe:', user.id);

    const metadata = {
      referralCode: referralCode,
      referredAt: new Date().toISOString(),
      source: 'affiliate_tracking'
    };

    console.log('📝 Updating user metadata with:', metadata);

    const updateSuccess = await sharetribeAPI.updateUserMetadata(user.id, metadata);

    if (updateSuccess) {
      console.log('✅ User metadata updated successfully in Sharetribe');
    } else {
      console.log('⚠️ Failed to update user metadata in Sharetribe');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('user_metadata')
      .upsert({
        sharetribe_user_id: user.id,
        user_email: userEmail,
        referral_code: referralCode,
        metadata: metadata,
        updated_at: new Date().toISOString()
      });

    console.log('✅ Metadata stored in database for user:', user.id);

    return true;

  } catch (error) {
    console.error('❌ Error updating Sharetribe user metadata:', error);
    return false;
  }
}

// Helper function to update ShareTribe user stats
async function updateSharetribeUserStats(userEmail: string, referralId: string) {
  console.log('🔄 Updating ShareTribe user stats for:', userEmail);

  try {
    // Get the user ID from the referral
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: referral, error: referralError } = await supabaseClient
      .from('referrals')
      .select('user_id')
      .eq('id', referralId)
      .single();

    if (referralError || !referral) {
      console.log('❌ Referral not found:', referralId);
      return false;
    }

    // Get ShareTribe credentials from database
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(referral.user_id);

    if (!credentials) {
      console.log('No ShareTribe credentials found for user:', referral.user_id);
      return false;
    }

    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI(credentials);

    // Get user by email
    const user = await sharetribeAPI.getUserByEmail(userEmail);
    if (!user) {
      console.log('❌ User not found in ShareTribe:', userEmail);
      return false;
    }

    console.log('✅ Found user in ShareTribe:', user.id);

    // Get comprehensive user stats
    const stats = await sharetribeAPI.getUserStats(user.id);
    if (!stats) {
      console.log('❌ Could not fetch user stats for:', user.id);
      return false;
    }

    console.log('📊 User stats fetched:', stats);

    // Update referral record with ShareTribe data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      return false;
    }

    console.log('✅ ShareTribe user stats updated successfully for referral:', referralId);
    return true;

  } catch (error) {
    console.error('❌ Error updating ShareTribe user stats:', error);
    return false;
  }
} 