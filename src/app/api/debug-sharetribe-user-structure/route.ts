import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🔍 Debugging ShareTribe user structure for user:', userId);

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

    // Use Integration API credentials
    if (!settingsObj.integrationClientId || !settingsObj.integrationClientSecret) {
      return NextResponse.json({ 
        success: false, 
        message: 'Integration API credentials required' 
      });
    }

    // Import SDK
    let sharetribeIntegrationSdk;
    try {
      const module = await import('sharetribe-flex-integration-sdk');
      sharetribeIntegrationSdk = module.default || module;
    } catch (importError) {
      return NextResponse.json({ 
        success: false, 
        message: 'SDK import failed',
        error: importError instanceof Error ? importError.message : 'Unknown error'
      });
    }

    const integrationSdk = sharetribeIntegrationSdk.createInstance({
      clientId: settingsObj.integrationClientId,
      clientSecret: settingsObj.integrationClientSecret
    });

    // Get a few users to examine their structure
    const usersResponse = await integrationSdk.users.query({
      limit: 5
    });

    if (!usersResponse || !usersResponse.data || !usersResponse.data.data) {
      return NextResponse.json({ 
        success: false, 
        message: 'No users found or invalid response' 
      });
    }

    const users = usersResponse.data.data;
    const userStructures = users.map((user: any) => ({
      id: user.id,
      type: user.type,
      attributes: user.attributes,
      // Check for emailVerified in different possible locations
      emailVerified_direct: user.attributes?.emailVerified,
      emailVerified_nested: user.attributes?.profile?.emailVerified,
      emailVerified_root: user.emailVerified,
      // Full structure for debugging
      fullStructure: user
    }));

    return NextResponse.json({ 
      success: true, 
      message: 'ShareTribe user structure analysis',
      userCount: users.length,
      userStructures: userStructures,
      sampleUser: users[0] ? {
        id: users[0].id,
        email: users[0].attributes?.email,
        emailVerified: users[0].attributes?.emailVerified,
        profile: users[0].attributes?.profile,
        allAttributes: users[0].attributes
      } : null
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
} 