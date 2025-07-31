import { NextRequest, NextResponse } from 'next/server';
import { affiliatesAPI } from '@/lib/database';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { generateReferralLink } from '@/lib/referral-utils';

export async function GET(request: NextRequest) {
  try {
    // Get the user from the request headers
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

    // Use authenticated client to fetch affiliates
    const { data: affiliates, error } = await authenticatedSupabase
      .from('affiliates')
      .select(`
        *,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, affiliates: affiliates || [] });
  } catch (error) {
    console.error('Failed to fetch affiliates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Affiliates POST - Starting...');
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Affiliates POST - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Affiliates POST - Token length:', token.length);
    
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
    
    console.log('Affiliates POST - Authenticated client created');
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Affiliates POST - Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Affiliates POST - User authenticated:', user.id);

    const body = await request.json();
    console.log('Affiliates POST - Request body:', body);

    // Validate required fields
    if (!body.name || !body.email || !body.programId) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and program are required' },
        { status: 400 }
      );
    }

    // Check if email already exists for this user
    console.log('=== EMAIL VALIDATION DEBUG ===');
    console.log('Checking for existing affiliate with email:', body.email);
    console.log('User ID:', user.id);
    
    const { data: existingAffiliate, error: checkError } = await authenticatedSupabase
      .from('affiliates')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('email', body.email)
      .single();

    console.log('Email check result:', { existingAffiliate, checkError });

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking for existing affiliate:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking for existing affiliate' },
        { status: 500 }
      );
    }

    if (existingAffiliate) {
      console.log('❌ Duplicate email found:', existingAffiliate);
      return NextResponse.json(
        { success: false, message: `An affiliate with email "${body.email}" already exists` },
        { status: 400 }
      );
    }
    
    console.log('✅ Email validation passed - no duplicates found');
    console.log('=== END EMAIL VALIDATION DEBUG ===');
    
    // Generate referral code and link
    const referralCode = `${body.name.toUpperCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`;
    
    // Get ShareTribe marketplace URL from settings
    let baseUrl = 'https://marketplace.com'; // fallback
    try {
      console.log('=== REFERRAL LINK DEBUG ===');
      console.log('Fetching ShareTribe marketplace URL for user:', user.id);
      
      // First, let's check what settings exist for this user
      const { data: allSettings, error: allSettingsError } = await authenticatedSupabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id);
      
      if (allSettingsError) {
        console.log('Error fetching all settings:', allSettingsError);
      } else {
        console.log('All settings for user:', allSettings);
        console.log('ShareTribe settings:', allSettings?.filter(s => s.setting_type === 'sharetribe'));
      }
      
      // Look for ShareTribe marketplace URL - try multiple variations
      let settingsResponse = null;
      
      // Try marketplaceUrl first
      try {
        const { data, error } = await authenticatedSupabase
          .from('settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_type', 'sharetribe')
          .eq('setting_key', 'marketplaceUrl')
          .single();
        
        if (error) {
          console.log('marketplaceUrl query error:', error);
        } else {
          settingsResponse = { data, error };
          console.log('Settings response (marketplaceUrl):', settingsResponse);
        }
      } catch (error) {
        console.log('No marketplaceUrl found, trying marketplace_url');
      }
      
      // Try marketplace_url if first attempt failed
      if (!settingsResponse?.data?.setting_value) {
        try {
          const { data, error } = await authenticatedSupabase
            .from('settings')
            .select('setting_value')
            .eq('user_id', user.id)
            .eq('setting_type', 'sharetribe')
            .eq('setting_key', 'marketplace_url')
            .single();
          
          if (error) {
            console.log('marketplace_url query error:', error);
          } else {
            settingsResponse = { data, error };
            console.log('Settings response (marketplace_url):', settingsResponse);
          }
        } catch (error) {
          console.log('No marketplace_url found either');
        }
      }
      
      // Try url if both attempts failed
      if (!settingsResponse?.data?.setting_value) {
        try {
          const { data, error } = await authenticatedSupabase
            .from('settings')
            .select('setting_value')
            .eq('user_id', user.id)
            .eq('setting_type', 'sharetribe')
            .eq('setting_key', 'url')
            .single();
          
          if (error) {
            console.log('url query error:', error);
          } else {
            settingsResponse = { data, error };
            console.log('Settings response (url):', settingsResponse);
          }
        } catch (error) {
          console.log('No url found either');
        }
      }
      
      if (settingsResponse?.data?.setting_value) {
        baseUrl = settingsResponse.data.setting_value;
        console.log('✅ Using ShareTribe URL:', baseUrl);
      } else {
        console.log('❌ No ShareTribe URL found in settings, using fallback');
        if (allSettings) {
          console.log('Available settings types:', allSettings.map(s => `${s.setting_type}.${s.setting_key}`));
        }
      }
      
      console.log('=== END REFERRAL LINK DEBUG ===');
    } catch (error) {
      console.log('Error fetching ShareTribe marketplace URL:', error);
      console.log('Using fallback URL:', baseUrl);
    }
    
    // Generate referral link with proper URL normalization
    const referralLink = generateReferralLink(baseUrl, referralCode);
    
    // Use authenticated client to create affiliate
    const { data: affiliate, error } = await authenticatedSupabase
      .from('affiliates')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        status: body.status,
        program_id: body.programId,
        user_id: user.id,
        referral_code: referralCode,
        referral_link: referralLink
      })
      .select()
      .single();
    
    if (error) {
      console.log('Affiliates POST - Database error:', error);
      throw error;
    }
    
    console.log('Affiliates POST - Affiliate created successfully:', affiliate);
    
    if (affiliate) {
      return NextResponse.json({ success: true, affiliate });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create affiliate' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Affiliates POST - Failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create affiliate',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 