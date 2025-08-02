import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🧪 Testing ShareTribe Integration API for user:', userId);

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

    // Use Integration API credentials (required for user lookups)
    let clientId, clientSecret;
    if (settingsObj.integrationClientId && settingsObj.integrationClientSecret) {
      clientId = settingsObj.integrationClientId;
      clientSecret = settingsObj.integrationClientSecret;
      console.log('🔑 Using Integration API credentials');
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Integration API credentials required for user lookups' 
      });
    }

    // Step 1: Test marketplace.show first (basic connection test)
    console.log('🏪 Step 1: Testing marketplace connection...');
    
    // Dynamic import for SDK
    const { default: sharetribeIntegrationSdk } = await import('sharetribe-flex-integration-sdk');
    
    const integrationSdk = sharetribeIntegrationSdk.createInstance({
      clientId: clientId,
      clientSecret: clientSecret
    });

    try {
      const marketplaceResponse = await integrationSdk.marketplace.show();
      console.log('✅ Marketplace connection successful:', marketplaceResponse.data?.id);
    } catch (marketplaceError) {
      console.error('❌ Marketplace connection failed:', marketplaceError);
      return NextResponse.json({ 
        success: false, 
        message: 'Marketplace connection failed',
        error: marketplaceError instanceof Error ? marketplaceError.message : 'Unknown error'
      });
    }

    // Step 2: Test users API call using Integration API
    console.log('👥 Step 2: Testing users API...');
    
    try {
      const usersResponse = await integrationSdk.users.query({
        limit: 3
      });
      
      console.log('✅ Users API call successful');
      console.log('📊 Response structure:', JSON.stringify(usersResponse, null, 2));

      return NextResponse.json({ 
        success: true, 
        message: 'ShareTribe Integration API test successful',
        response: usersResponse,
        credentials: {
          type: 'Integration API',
          clientId: clientId ? 'SET' : 'NOT SET',
          clientSecret: clientSecret ? 'SET' : 'NOT SET'
        }
      });

    } catch (usersError) {
      console.error('❌ Users API call failed:', usersError);
      return NextResponse.json({ 
        success: false, 
        message: 'Users API call failed',
        error: usersError instanceof Error ? usersError.message : 'Unknown error'
      });
    }

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