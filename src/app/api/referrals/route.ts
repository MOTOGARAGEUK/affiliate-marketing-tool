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

    // Fetch referrals with affiliate information
    const { data: referrals, error } = await authenticatedSupabase
      .from('referrals')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    // Transform the data to include affiliate information and ShareTribe fields
    const transformedReferrals = referrals?.map(referral => ({
      id: referral.id,
      affiliate_id: referral.affiliate_id,
      affiliate_name: referral.affiliates?.name || 'Unknown Affiliate',
      affiliate_email: referral.affiliates?.email || 'No email',
      customer_email: referral.customer_email,
      customer_name: referral.customer_name,
      status: referral.status || 'pending',
      commission: referral.commission || 0,
      referral_code: referral.referral_code,
      created_at: referral.created_at,
      // ShareTribe fields
      sharetribe_user_id: referral.sharetribe_user_id,
      sharetribe_created_at: referral.sharetribe_created_at,
      listings_count: referral.listings_count,
      transactions_count: referral.transactions_count,
      total_revenue: referral.total_revenue,
      last_sync_at: referral.last_sync_at
    })) || [];

    return NextResponse.json({ 
      success: true, 
      referrals: transformedReferrals 
    });
  } catch (error) {
    console.error('Failed to fetch referrals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
} 