import { NextRequest, NextResponse } from 'next/server';
import { settingsAPI } from '@/lib/settings-database';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Settings GET - Starting...');
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    let user = null;
    let authenticatedSupabase = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Create an authenticated client with the user's token
      authenticatedSupabase = createClient(
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
      
      const { data: { user: authUser }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (!authError && authUser) {
        user = authUser;
      }
    }

    // If no user is authenticated, return default settings
    if (!user) {
      console.log('Settings GET - No authenticated user, returning defaults');
      return NextResponse.json({
        success: true,
        settings: {
          sharetribe: {
            clientId: '',
            clientSecret: '',
            marketplaceUrl: '',
          },
          general: {
            companyName: 'My Affiliate Program',
            defaultCommission: 10,
            currency: 'USD',
            timezone: 'UTC',
            autoApproveReferrals: true,
            minimumPayout: 50,
          }
        }
      });
    }

    console.log('Settings GET - User ID:', user.id);
    
    let allSettings = [];
    try {
      // Use authenticated client to load settings
      const { data, error } = await authenticatedSupabase
        .from('settings')
        .select('setting_type, setting_key, setting_value')
        .eq('user_id', user.id);
      
      if (error) throw error;
      allSettings = data || [];
      console.log('Settings GET - Settings loaded:', allSettings?.length || 0);
    } catch (dbError) {
      console.error('Settings GET - Database error:', dbError);
      throw dbError;
    }
    
    // Transform settings to the expected format
    const settings = {
      sharetribe: {
        clientId: '',
        clientSecret: '',
        marketplaceUrl: '',
      },
      general: {
        companyName: 'My Affiliate Program',
        defaultCommission: 10,
        currency: 'USD',
        timezone: 'UTC',
        autoApproveReferrals: true,
        minimumPayout: 50,
      }
    };

    // Process sharetribe settings
    const sharetribeSettings = allSettings.filter(s => s.setting_type === 'sharetribe');
    sharetribeSettings.forEach(setting => {
      settings.sharetribe[setting.setting_key] = setting.setting_value;
    });

    // Process general settings
    const generalSettings = allSettings.filter(s => s.setting_type === 'general');
    generalSettings.forEach(setting => {
      settings.general[setting.setting_key] = setting.setting_value;
    });

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Failed to load settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Settings POST - Starting...');
    
    // First, let's test if the route is working at all
    console.log('Settings POST - Route is accessible');
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Settings POST - Auth header:', authHeader ? 'Present' : 'Missing');
    let user = null;
    let authenticatedSupabase = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      console.log('Settings POST - Token extracted, length:', token.length);
      
      // Create an authenticated client with the user's token
      authenticatedSupabase = createClient(
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
      
      const { data: { user: authUser }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (!authError && authUser) {
        user = authUser;
        console.log('Settings POST - User authenticated:', user.id);
      } else {
        console.log('Settings POST - Auth error:', authError);
      }
    }

    // If no user is authenticated, return error
    if (!user) {
      console.log('Settings POST - No authenticated user, returning 401');
      return NextResponse.json({
        success: false,
        message: 'Authentication required to save settings'
      }, { status: 401 });
    }

    const body = await request.json();
    const { type, settings } = body;
    console.log('Settings POST - Request body:', { type, settings });

    if (type === 'sharetribe') {
      console.log('Settings POST - Processing sharetribe settings');
      // Save sharetribe settings using authenticated client
      const settingsArray = Object.entries({
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
        marketplaceUrl: settings.marketplaceUrl,
      }).map(([key, value]) => ({
        user_id: user.id,
        setting_type: 'sharetribe',
        setting_key: key,
        setting_value: value
      }));

      const { data, error } = await authenticatedSupabase
        .from('settings')
        .upsert(settingsArray)
        .select('setting_type, setting_key, setting_value');

      if (error) throw error;
      console.log('Settings POST - ShareTribe settings saved successfully');
    } else if (type === 'general') {
      console.log('Settings POST - Processing general settings');
      // Save general settings using authenticated client
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        user_id: user.id,
        setting_type: 'general',
        setting_key: key,
        setting_value: value
      }));

      const { data, error } = await authenticatedSupabase
        .from('settings')
        .upsert(settingsArray)
        .select('setting_type, setting_key, setting_value');

      if (error) throw error;
      console.log('Settings POST - General settings saved successfully');
    }

    // Return updated settings
    console.log('Settings POST - Fetching updated settings...');
    const { data: updatedAllSettings, error: fetchError } = await authenticatedSupabase
      .from('settings')
      .select('setting_type, setting_key, setting_value')
      .eq('user_id', user.id);
    
    if (fetchError) throw fetchError;
    console.log('Settings POST - Updated settings count:', updatedAllSettings?.length || 0);
    
    // Transform settings to the expected format
    const updatedSettings = {
      sharetribe: {
        clientId: '',
        clientSecret: '',
        marketplaceUrl: '',
      },
      general: {
        companyName: 'My Affiliate Program',
        defaultCommission: 10,
        currency: 'USD',
        timezone: 'UTC',
        autoApproveReferrals: true,
        minimumPayout: 50,
      }
    };

    // Process sharetribe settings
    const updatedSharetribeSettings = updatedAllSettings.filter(s => s.setting_type === 'sharetribe');
    updatedSharetribeSettings.forEach(setting => {
      updatedSettings.sharetribe[setting.setting_key] = setting.setting_value;
    });

    // Process general settings
    const updatedGeneralSettings = updatedAllSettings.filter(s => s.setting_type === 'general');
    updatedGeneralSettings.forEach(setting => {
      updatedSettings.general[setting.setting_key] = setting.setting_value;
    });

    console.log('Settings POST - Returning success response');
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to save settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 