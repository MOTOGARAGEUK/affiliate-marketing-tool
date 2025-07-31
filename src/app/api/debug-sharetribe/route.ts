import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Create authenticated Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Debugging ShareTribe settings for user:', user.id);

    // Get all settings for this user
    const { data: allSettings, error: allSettingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id);

    if (allSettingsError) {
      console.log('Error fetching all settings:', allSettingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    console.log('All settings:', allSettings);

    // Get ShareTribe specific settings
    const { data: sharetribeSettings, error: sharetribeError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('setting_type', 'sharetribe');

    if (sharetribeError) {
      console.log('Error fetching ShareTribe settings:', sharetribeError);
    } else {
      console.log('ShareTribe settings:', sharetribeSettings);
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      all_settings: allSettings,
      sharetribe_settings: sharetribeSettings || [],
      available_setting_types: allSettings?.map(s => s.setting_type) || [],
      sharetribe_keys: sharetribeSettings?.map(s => s.setting_key) || []
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 