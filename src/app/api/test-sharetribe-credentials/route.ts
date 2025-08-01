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

    console.log('🔍 Checking ShareTribe credentials for user:', userId);

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

    // Check what type of credentials are configured
    const hasMarketplaceCredentials = settingsObj.marketplaceClientId && settingsObj.marketplaceClientSecret;
    const hasIntegrationCredentials = settingsObj.integrationClientId && settingsObj.integrationClientSecret;
    const hasMarketplaceUrl = settingsObj.marketplaceUrl;

    return NextResponse.json({
      success: true,
      credentials: {
        hasMarketplaceCredentials,
        hasIntegrationCredentials,
        hasMarketplaceUrl,
        marketplaceUrl: settingsObj.marketplaceUrl,
        // Don't return actual credentials for security
        marketplaceClientId: settingsObj.marketplaceClientId ? '***configured***' : 'not configured',
        integrationClientId: settingsObj.integrationClientId ? '***configured***' : 'not configured'
      },
      settings: Object.keys(settingsObj)
    });

  } catch (error) {
    console.error('❌ Credentials test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Credentials test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 