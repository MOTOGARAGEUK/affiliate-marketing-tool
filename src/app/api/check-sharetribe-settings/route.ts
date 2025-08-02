import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🔍 Checking ShareTribe settings for user:', userId);

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

    if (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error fetching settings',
        error: error.message 
      });
    }

    if (!settings || settings.length === 0) {
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

    return NextResponse.json({ 
      success: true, 
      message: 'ShareTribe settings found',
      settings: {
        marketplaceClientId: settingsObj.marketplaceClientId ? 'SET' : 'NOT SET',
        marketplaceClientSecret: settingsObj.marketplaceClientSecret ? 'SET' : 'NOT SET',
        marketplaceUrl: settingsObj.marketplaceUrl || 'NOT SET',
        integrationClientId: settingsObj.integrationClientId ? 'SET' : 'NOT SET',
        integrationClientSecret: settingsObj.integrationClientSecret ? 'SET' : 'NOT SET'
      },
      rawSettings: settingsObj
    });

  } catch (error) {
    console.error('❌ Check settings error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Check settings failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 