import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🧪 Testing ShareTribe users API for user:', userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get ShareTribe settings
    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', userId)
      .eq('setting_type', 'sharetribe');

    if (error || !settings || settings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No ShareTribe settings found' 
      });
    }

    // Convert to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    console.log('📋 Settings found:', Object.keys(settingsObj));

    // Use Integration API credentials if available, otherwise Marketplace API
    let clientId, clientSecret;
    if (settingsObj.integrationClientId && settingsObj.integrationClientSecret) {
      clientId = settingsObj.integrationClientId;
      clientSecret = settingsObj.integrationClientSecret;
      console.log('🔑 Using Integration API credentials');
    } else if (settingsObj.marketplaceClientId && settingsObj.marketplaceClientSecret) {
      clientId = settingsObj.marketplaceClientId;
      clientSecret = settingsObj.marketplaceClientSecret;
      console.log('🔑 Using Marketplace API credentials');
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'No ShareTribe credentials found' 
      });
    }

    // Step 1: Get access token
    console.log('🔑 Step 1: Getting access token...');
    const tokenResponse = await fetch('https://auth.dev.sharetribe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    console.log('🔑 Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token request failed:', errorText);
      return NextResponse.json({ 
        success: false, 
        message: 'Token request failed',
        error: errorText,
        status: tokenResponse.status
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token received:', { 
      access_token: tokenData.access_token ? 'Present' : 'Missing', 
      expires_in: tokenData.expires_in 
    });

    if (!tokenData.access_token) {
      return NextResponse.json({ 
        success: false, 
        message: 'No access token received' 
      });
    }

    // Step 2: Test users API call
    console.log('👥 Step 2: Testing users API...');
    const usersResponse = await fetch('https://api.dev.sharetribe.com/v1/users?limit=3', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('👥 Users API response status:', usersResponse.status);

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('❌ Users API call failed:', errorText);
      return NextResponse.json({ 
        success: false, 
        message: 'Users API call failed',
        error: errorText,
        status: usersResponse.status
      });
    }

    const usersData = await usersResponse.json();
    console.log('✅ Users API call successful');
    console.log('📊 Response structure:', JSON.stringify(usersData, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'ShareTribe users API test successful',
      response: usersData,
      credentials: {
        type: settingsObj.integrationClientId ? 'Integration API' : 'Marketplace API',
        clientId: clientId ? 'SET' : 'NOT SET',
        clientSecret: clientSecret ? 'SET' : 'NOT SET'
      }
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
} 