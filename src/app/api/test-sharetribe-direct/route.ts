import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🔍 Direct ShareTribe test for user:', userId);

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

    const clientId = settingsObj.marketplaceClientId;
    const clientSecret = settingsObj.marketplaceClientSecret;

    console.log('🔍 Using credentials:', {
      clientId: clientId ? 'SET' : 'NOT SET',
      clientSecret: clientSecret ? 'SET' : 'NOT SET'
    });

    // Step 1: Test direct SDK import
    console.log('📦 Step 1: Testing SDK import...');
    let sharetribeIntegrationSdk;
    try {
      sharetribeIntegrationSdk = await import('sharetribe-flex-integration-sdk');
      console.log('✅ SDK import successful');
    } catch (importError) {
      console.error('❌ SDK import failed:', importError);
      return NextResponse.json({ 
        success: false, 
        step: 'import',
        error: importError instanceof Error ? importError.message : 'Import failed'
      });
    }

    // Step 2: Test SDK instance creation
    console.log('🏗️ Step 2: Testing SDK instance creation...');
    let sdk;
    try {
      sdk = sharetribeIntegrationSdk.createInstance({
        clientId: clientId,
        clientSecret: clientSecret
      });
      console.log('✅ SDK instance created');
    } catch (createError) {
      console.error('❌ SDK instance creation failed:', createError);
      return NextResponse.json({ 
        success: false, 
        step: 'create',
        error: createError instanceof Error ? createError.message : 'Creation failed'
      });
    }

    // Step 3: Test marketplace.show() call
    console.log('🔌 Step 3: Testing marketplace.show()...');
    try {
      const response = await sdk.marketplace.show();
      console.log('✅ marketplace.show() successful');
      console.log('📊 Response:', JSON.stringify(response, null, 2));
      
      if (response.data && response.data.data) {
        return NextResponse.json({ 
          success: true, 
          message: 'ShareTribe connection successful',
          marketplace: response.data.data.attributes.name,
          response: response
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          step: 'response',
          message: 'No data in response',
          response: response
        });
      }
    } catch (apiError) {
      console.error('❌ marketplace.show() failed:', apiError);
      console.error('❌ API Error details:', {
        message: apiError instanceof Error ? apiError.message : 'Unknown error',
        stack: apiError instanceof Error ? apiError.stack : 'No stack trace'
      });
      
      return NextResponse.json({ 
        success: false, 
        step: 'api',
        message: 'API call failed',
        error: apiError instanceof Error ? apiError.message : 'Unknown error',
        stack: apiError instanceof Error ? apiError.stack : 'No stack trace'
      });
    }

  } catch (error) {
    console.error('❌ Direct test error:', error);
    return NextResponse.json({ 
      success: false, 
      step: 'general',
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
} 