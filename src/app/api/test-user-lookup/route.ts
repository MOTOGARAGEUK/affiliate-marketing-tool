import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    console.log('🔍 Testing user lookup for email:', email, 'user:', userId);

    if (!email || !userId) {
      return NextResponse.json(
        { success: false, message: 'Email and userId required' },
        { status: 400 }
      );
    }

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

    if (settingsError || !settings || settings.length === 0) {
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

    // Get credentials
    let credentials = null;
    if (settingsObj.marketplaceClientId && settingsObj.marketplaceClientSecret) {
      credentials = {
        clientId: settingsObj.marketplaceClientId,
        clientSecret: settingsObj.marketplaceClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl
      };
    } else if (settingsObj.integrationClientId && settingsObj.integrationClientSecret) {
      credentials = {
        clientId: settingsObj.integrationClientId,
        clientSecret: settingsObj.integrationClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl
      };
    }

    if (!credentials) {
      return NextResponse.json(
        { success: false, message: 'No valid credentials found' },
        { status: 400 }
      );
    }

    console.log('✅ Using credentials for API call');

    // Test the exact same API call that the sync function makes
    try {
      const { createSharetribeAPI } = await import('@/lib/sharetribe');
      const sharetribeAPI = createSharetribeAPI(credentials);
      
      console.log('🔍 Calling getUserByEmail with email:', email);
      const user = await sharetribeAPI.getUserByEmail(email);
      
      console.log('✅ getUserByEmail result:', user ? 'User found' : 'User not found');
      
      return NextResponse.json({
        success: true,
        userFound: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt
        } : null
      });

    } catch (apiError) {
      console.error('❌ API call failed:', apiError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'API call failed',
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
          stack: apiError instanceof Error ? apiError.stack : 'No stack trace'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
} 