import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🧪 Simple ShareTribe test for user:', userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Step 1: Get ShareTribe settings
    console.log('📋 Step 1: Getting ShareTribe settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', userId)
      .eq('setting_type', 'sharetribe');

    if (settingsError) {
      console.error('❌ Settings error:', settingsError);
      return NextResponse.json({ 
        success: false, 
        step: 'settings',
        error: settingsError.message 
      });
    }

    console.log('📋 Settings found:', settings?.length || 0);

    if (!settings || settings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        step: 'settings',
        message: 'No ShareTribe settings found' 
      });
    }

    // Convert to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    console.log('📋 Settings keys:', Object.keys(settingsObj));
    console.log('📋 marketplaceClientId:', settingsObj.marketplaceClientId ? 'SET' : 'NOT SET');
    console.log('📋 marketplaceClientSecret:', settingsObj.marketplaceClientSecret ? 'SET' : 'NOT SET');
    console.log('📋 marketplaceUrl:', settingsObj.marketplaceUrl || 'NOT SET');

    // Step 2: Create ShareTribe config
    console.log('🔧 Step 2: Creating ShareTribe config...');
    const config = {
      clientId: settingsObj.marketplaceClientId,
      clientSecret: settingsObj.marketplaceClientSecret,
      marketplaceUrl: settingsObj.marketplaceUrl
    };

    console.log('🔧 Config created:', {
      clientId: config.clientId ? 'SET' : 'NOT SET',
      clientSecret: config.clientSecret ? 'SET' : 'NOT SET',
      marketplaceUrl: config.marketplaceUrl || 'NOT SET'
    });

    // Step 3: Import and create API
    console.log('📦 Step 3: Importing ShareTribe modules...');
    const { getSharetribeCredentials, createSharetribeAPI } = await import('@/lib/sharetribe');
    
    console.log('📦 Modules imported successfully');

    // Step 4: Get credentials (this should work now)
    console.log('🔑 Step 4: Getting ShareTribe credentials...');
    const credentials = await getSharetribeCredentials(userId);
    
    if (!credentials) {
      return NextResponse.json({ 
        success: false, 
        step: 'credentials',
        message: 'Failed to get ShareTribe credentials' 
      });
    }

    console.log('🔑 Credentials found:', {
      clientId: credentials.clientId ? 'SET' : 'NOT SET',
      clientSecret: credentials.clientSecret ? 'SET' : 'NOT SET',
      marketplaceUrl: credentials.marketplaceUrl || 'NOT SET'
    });

    // Step 5: Create API instance
    console.log('🏗️ Step 5: Creating ShareTribe API instance...');
    const sharetribeAPI = createSharetribeAPI(credentials);
    console.log('🏗️ API instance created');

    // Step 6: Test connection
    console.log('🔌 Step 6: Testing ShareTribe connection...');
    const connectionResult = await sharetribeAPI.testConnection();
    console.log('🔌 Connection test result:', connectionResult);

    if (!connectionResult) {
      return NextResponse.json({ 
        success: false, 
        step: 'connection',
        message: 'ShareTribe connection test failed',
        config: {
          clientId: credentials.clientId ? 'SET' : 'NOT SET',
          clientSecret: credentials.clientSecret ? 'SET' : 'NOT SET',
          marketplaceUrl: credentials.marketplaceUrl || 'NOT SET'
        }
      });
    }

    // Step 7: Test user lookup
    console.log('👤 Step 7: Testing user lookup...');
    const testEmail = 'test@example.com';
    const user = await sharetribeAPI.getUserByEmail(testEmail);
    console.log('👤 User lookup result:', user ? 'User found' : 'User not found');

    return NextResponse.json({ 
      success: true, 
      message: 'All ShareTribe tests passed',
      results: {
        settingsFound: true,
        credentialsFound: true,
        connectionTest: true,
        userLookup: user ? 'working' : 'no test user found'
      }
    });

  } catch (error) {
    console.error('❌ Simple test error:', error);
    return NextResponse.json({ 
      success: false, 
      step: 'error',
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
} 