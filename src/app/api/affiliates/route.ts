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
    
    // First, let's check all affiliates for this user to see what's there
    const { data: allAffiliates, error: allAffiliatesError } = await authenticatedSupabase
      .from('affiliates')
      .select('id, name, email')
      .eq('user_id', user.id);
    
    console.log('All affiliates for user:', allAffiliates);
    console.log('All affiliate emails:', allAffiliates?.map(a => a.email));
    
    // Now check for the specific email
    const { data: existingAffiliate, error: checkError } = await authenticatedSupabase
      .from('affiliates')
      .select('id, name, email')
      .eq('user_id', user.id)
      .eq('email', body.email.toLowerCase().trim())
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors

    console.log('Email check result:', { existingAffiliate, checkError });

    if (checkError) {
      console.error('Error checking for existing affiliate:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking for existing affiliate' },
        { status: 500 }
      );
    }

    if (existingAffiliate) {
      console.log('❌ Duplicate email found:', existingAffiliate);
      return NextResponse.json(
        { success: false, message: `Sorry, this affiliate email already exists` },
        { status: 400 }
      );
    }
    
    console.log('✅ Email validation passed - no duplicates found');
    console.log('=== END EMAIL VALIDATION DEBUG ===');
    
    // Generate referral code and link
    const referralCode = `${body.name.toUpperCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`;
    
    // Get program details to determine link type
    const { data: program, error: programError } = await authenticatedSupabase
      .from('programs')
      .select('type')
      .eq('id', body.programId)
      .single();
    
    if (programError) {
      console.log('Error fetching program details:', programError);
      return NextResponse.json(
        { success: false, message: 'Invalid program selected' },
        { status: 400 }
      );
    }
    
    let referralLink: string;
    
    if (program.type === 'signup') {
      // For signup programs, use our cookie-setting endpoint first
      referralLink = `https://your-domain.com/api/set-referral-cookie?ref=${referralCode}&redirect=https://test.moto-garage.co.uk/signup`;
      console.log('✅ Generated signup referral link:', referralLink);
    } else {
      // For purchase programs, get ShareTribe marketplace URL from settings
      let baseUrl = 'https://marketplace.com'; // fallback
      try {
        console.log('=== REFERRAL LINK DEBUG ===');
        console.log('Fetching ShareTribe marketplace URL for user:', user.id);
        
        // Get all ShareTribe settings for this user
        const { data: sharetribeSettings, error: sharetribeError } = await authenticatedSupabase
          .from('settings')
          .select('setting_key, setting_value')
          .eq('user_id', user.id)
          .eq('setting_type', 'sharetribe');
        
        if (sharetribeError) {
          console.log('Error fetching ShareTribe settings:', sharetribeError);
        } else {
          console.log('ShareTribe settings found:', sharetribeSettings);
          
          // Look for marketplace URL in any of the ShareTribe settings
          const marketplaceUrlSetting = sharetribeSettings?.find(s => 
            s.setting_key === 'marketplaceUrl' || 
            s.setting_key === 'marketplace_url' || 
            s.setting_key === 'url'
          );
          
          if (marketplaceUrlSetting?.setting_value) {
            baseUrl = marketplaceUrlSetting.setting_value;
            console.log('✅ Using ShareTribe URL:', baseUrl);
          } else {
            console.log('❌ No marketplace URL found in ShareTribe settings');
            console.log('Available ShareTribe keys:', sharetribeSettings?.map(s => s.setting_key));
          }
        }
        
        console.log('=== END REFERRAL LINK DEBUG ===');
      } catch (error) {
        console.log('Error fetching ShareTribe marketplace URL:', error);
        console.log('Using fallback URL:', baseUrl);
      }
      
      // Generate referral link with proper URL normalization
      referralLink = generateReferralLink(baseUrl, referralCode);
      console.log('✅ Generated purchase referral link:', referralLink);
    }
    
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