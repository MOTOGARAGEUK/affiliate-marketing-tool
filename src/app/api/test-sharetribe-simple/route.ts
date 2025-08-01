import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId parameter required' },
        { status: 400 }
      );
    }

    console.log('🔍 Simple ShareTribe test for user:', userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get ShareTribe settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', userId)
      .eq('setting_type', 'sharetribe');

    if (settingsError) {
      console.error('❌ Settings error:', settingsError);
      return NextResponse.json(
        { success: false, message: 'Settings error', error: settingsError },
        { status: 500 }
      );
    }

    if (!settings || settings.length === 0) {
      console.error('❌ No ShareTribe settings found');
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

    console.log('✅ Found settings:', Object.keys(settingsObj));

    // Check credentials
    let credentials = null;
    if (settingsObj.marketplaceClientId && settingsObj.marketplaceClientSecret && settingsObj.marketplaceUrl) {
      credentials = {
        clientId: settingsObj.marketplaceClientId,
        clientSecret: settingsObj.marketplaceClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl
      };
      console.log('✅ Using marketplace API credentials');
    } else if (settingsObj.integrationClientId && settingsObj.integrationClientSecret && settingsObj.marketplaceUrl) {
      credentials = {
        clientId: settingsObj.integrationClientId,
        clientSecret: settingsObj.integrationClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl
      };
      console.log('✅ Using integration API credentials');
    } else {
      console.error('❌ No valid credentials found');
      return NextResponse.json(
        { success: false, message: 'No valid credentials found' },
        { status: 400 }
      );
    }

    // Test the API connection step by step
    console.log('🔍 Testing API connection...');
    
    try {
      // Step 1: Try to get access token
      console.log('🔍 Step 1: Getting access token...');
      const tokenResponse = await fetch('https://auth.sharetribe.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
        }),
      });

      console.log('Token response status:', tokenResponse.status, tokenResponse.statusText);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Token request failed:', errorText);
        return NextResponse.json(
          { success: false, message: 'Token request failed', error: errorText },
          { status: 500 }
        );
      }

      const tokenData = await tokenResponse.json();
      console.log('✅ Token received:', { access_token: tokenData.access_token ? 'Present' : 'Missing', expires_in: tokenData.expires_in });

      if (!tokenData.access_token) {
        return NextResponse.json(
          { success: false, message: 'No access token received' },
          { status: 500 }
        );
      }

      // Step 2: Try to make a simple API call
      console.log('🔍 Step 2: Making API call...');
      const apiResponse = await fetch('https://api.sharetribe.com/v1/users?limit=1', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API response status:', apiResponse.status, apiResponse.statusText);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('❌ API call failed:', errorText);
        return NextResponse.json(
          { success: false, message: 'API call failed', error: errorText },
          { status: 500 }
        );
      }

      const apiData = await apiResponse.json();
      console.log('✅ API call successful:', apiData);

      return NextResponse.json({
        success: true,
        message: 'ShareTribe API connection successful',
        tokenReceived: true,
        apiCallSuccessful: true,
        settingsFound: Object.keys(settingsObj)
      });

    } catch (apiError) {
      console.error('❌ API error:', apiError);
      return NextResponse.json(
        { success: false, message: 'API error', error: apiError },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Simple test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Simple test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 