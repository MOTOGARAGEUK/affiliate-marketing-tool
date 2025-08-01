import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralId, userEmail } = body;

    console.log('🔍 Debug sync error - Starting with:', { referralId, userEmail });

    if (!referralId || !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Missing referralId or userEmail' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Step 1: Get the referral and user ID
    console.log('🔍 Step 1: Getting referral data...');
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('user_id, customer_email')
      .eq('id', referralId)
      .single();

    if (referralError || !referral) {
      console.error('❌ Step 1 failed - Referral not found:', referralError);
      return NextResponse.json(
        { success: false, message: 'Referral not found', error: referralError },
        { status: 404 }
      );
    }

    console.log('✅ Step 1 success - Found referral:', { userId: referral.user_id, customerEmail: referral.customer_email });

    // Step 2: Get ShareTribe settings
    console.log('🔍 Step 2: Getting ShareTribe settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', referral.user_id)
      .eq('setting_type', 'sharetribe');

    if (settingsError) {
      console.error('❌ Step 2 failed - Settings error:', settingsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch settings', error: settingsError },
        { status: 500 }
      );
    }

    if (!settings || settings.length === 0) {
      console.error('❌ Step 2 failed - No ShareTribe settings found');
      return NextResponse.json(
        { success: false, message: 'No ShareTribe settings found' },
        { status: 400 }
      );
    }

    // Convert settings to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    console.log('✅ Step 2 success - Found settings:', Object.keys(settingsObj));

    // Step 3: Check if we have valid credentials
    console.log('🔍 Step 3: Checking credentials...');
    let credentials = null;
    
    if (settingsObj.marketplaceClientId && settingsObj.marketplaceClientSecret && settingsObj.marketplaceUrl) {
      credentials = {
        clientId: settingsObj.marketplaceClientId,
        clientSecret: settingsObj.marketplaceClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl
      };
      console.log('✅ Step 3 success - Using marketplace API credentials');
    } else if (settingsObj.integrationClientId && settingsObj.integrationClientSecret && settingsObj.marketplaceUrl) {
      credentials = {
        clientId: settingsObj.integrationClientId,
        clientSecret: settingsObj.integrationClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl
      };
      console.log('✅ Step 3 success - Using integration API credentials');
    } else {
      console.error('❌ Step 3 failed - No valid credentials found');
      return NextResponse.json(
        { success: false, message: 'No valid ShareTribe credentials found' },
        { status: 400 }
      );
    }

    // Step 4: Test ShareTribe API connection
    console.log('🔍 Step 4: Testing ShareTribe API connection...');
    try {
      const { createSharetribeAPI } = await import('@/lib/sharetribe');
      const sharetribeAPI = createSharetribeAPI(credentials);
      
      const connectionTest = await sharetribeAPI.testConnection();
      console.log('✅ Step 4 success - API connection test result:', connectionTest);
      
      if (!connectionTest) {
        return NextResponse.json(
          { success: false, message: 'ShareTribe API connection failed' },
          { status: 500 }
        );
      }
    } catch (apiError) {
      console.error('❌ Step 4 failed - API connection error:', apiError);
      return NextResponse.json(
        { success: false, message: 'ShareTribe API connection error', error: apiError },
        { status: 500 }
      );
    }

    // Step 5: Try to get user by email
    console.log('🔍 Step 5: Looking up user by email...');
    try {
      const { createSharetribeAPI } = await import('@/lib/sharetribe');
      const sharetribeAPI = createSharetribeAPI(credentials);
      
      const user = await sharetribeAPI.getUserByEmail(userEmail);
      console.log('✅ Step 5 success - User lookup result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found in ShareTribe' },
          { status: 404 }
        );
      }
    } catch (userError) {
      console.error('❌ Step 5 failed - User lookup error:', userError);
      return NextResponse.json(
        { success: false, message: 'User lookup error', error: userError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All debug steps passed successfully',
      steps: {
        referralFound: true,
        settingsFound: true,
        credentialsValid: true,
        apiConnection: true,
        userLookup: true
      }
    });

  } catch (error) {
    console.error('❌ Debug sync error failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Debug sync error failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
} 