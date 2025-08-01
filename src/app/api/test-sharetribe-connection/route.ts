import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create an authenticated client with the user's token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Testing ShareTribe connection for user:', user.id);

    // Check if user has ShareTribe settings configured
    const { data: settings, error: settingsError } = await authenticatedSupabase
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', user.id)
      .eq('setting_type', 'sharetribe');

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({
        success: false,
        message: 'Error fetching settings',
        error: settingsError.message
      }, { status: 500 });
    }

    if (!settings || settings.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No ShareTribe settings found',
        instructions: 'Please configure ShareTribe integration in the Settings page'
      }, { status: 404 });
    }

    // Convert settings array to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    console.log('✅ Found ShareTribe settings:', Object.keys(settingsObj));

    // Test ShareTribe API connection
    try {
      const { getSharetribeCredentials, createSharetribeAPI } = await import('@/lib/sharetribe');
      const credentials = await getSharetribeCredentials(user.id);

      if (!credentials) {
        return NextResponse.json({
          success: false,
          message: 'ShareTribe credentials not found',
          settings: settingsObj
        }, { status: 404 });
      }

      console.log('✅ Found ShareTribe credentials');

      const sharetribeAPI = createSharetribeAPI(credentials);
      
      // Test basic connection
      const connectionTest = await sharetribeAPI.testConnection();
      
      if (!connectionTest) {
        return NextResponse.json({
          success: false,
          message: 'ShareTribe API connection failed',
          settings: settingsObj,
          credentials: {
            hasClientId: !!credentials.clientId,
            hasClientSecret: !!credentials.clientSecret,
            hasMarketplaceUrl: !!credentials.marketplaceUrl
          }
        }, { status: 500 });
      }

      console.log('✅ ShareTribe API connection successful');

      // Get marketplace info
      const marketplaceInfo = await sharetribeAPI.getMarketplaceInfo();
      
      return NextResponse.json({
        success: true,
        message: 'ShareTribe connection successful',
        settings: settingsObj,
        marketplace: marketplaceInfo,
        credentials: {
          hasClientId: !!credentials.clientId,
          hasClientSecret: !!credentials.clientSecret,
          hasMarketplaceUrl: !!credentials.marketplaceUrl
        }
      });

    } catch (sharetribeError) {
      console.error('ShareTribe API error:', sharetribeError);
      return NextResponse.json({
        success: false,
        message: 'ShareTribe API error',
        error: sharetribeError instanceof Error ? sharetribeError.message : 'Unknown error',
        settings: settingsObj
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test ShareTribe connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 