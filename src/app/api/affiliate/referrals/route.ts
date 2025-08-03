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

    // Find the affiliate record for this user
    const { data: affiliate, error: affiliateError } = await authenticatedSupabase
      .from('affiliates')
      .select('id')
      .eq('email', user.email)
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Get referrals for this affiliate
    const { data: referrals, error: referralsError } = await authenticatedSupabase
      .from('referrals')
      .select(`
        id,
        customer_name,
        customer_email,
        commission,
        status,
        sharetribe_validation_status,
        created_at,
        programs (
          name
        )
      `)
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch referral data' },
        { status: 500 }
      );
    }

    // Transform the data to include program name
    const transformedReferrals = referrals?.map(referral => ({
      ...referral,
      program_name: referral.programs?.[0]?.name || null
    })) || [];

    return NextResponse.json({
      success: true,
      referrals: transformedReferrals
    });
  } catch (error) {
    console.error('Failed to fetch affiliate referrals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliate referrals' },
      { status: 500 }
    );
  }
} 