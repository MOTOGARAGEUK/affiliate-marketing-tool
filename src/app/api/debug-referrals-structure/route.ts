import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🔍 Debugging referrals structure for user:', userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all referrals in the system
    const { data: allReferrals, error: allReferralsError } = await supabase
      .from('referrals')
      .select('*');

    if (allReferralsError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch all referrals',
        error: allReferralsError
      });
    }

    // Get referrals for this specific user
    const { data: userReferrals, error: userReferralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('affiliate_id', userId);

    if (userReferralsError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch user referrals',
        error: userReferralsError
      });
    }

    // Get all affiliates
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('*');

    if (affiliatesError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch affiliates',
        error: affiliatesError
      });
    }

    console.log(`📊 Found ${allReferrals?.length || 0} total referrals in system`);
    console.log(`📊 Found ${userReferrals?.length || 0} referrals for user ${userId}`);
    console.log(`📊 Found ${affiliates?.length || 0} total affiliates`);

    return NextResponse.json({ 
      success: true, 
      message: 'Referrals structure analysis',
      summary: {
        totalReferrals: allReferrals?.length || 0,
        userReferrals: userReferrals?.length || 0,
        totalAffiliates: affiliates?.length || 0
      },
      allReferrals: allReferrals?.map(ref => ({
        id: ref.id,
        affiliate_id: ref.affiliate_id,
        customer_email: ref.customer_email,
        customer_name: ref.customer_name,
        status: ref.status,
        sharetribe_validation_status: ref.sharetribe_validation_status,
        created_at: ref.created_at
      })),
      userReferrals: userReferrals?.map(ref => ({
        id: ref.id,
        affiliate_id: ref.affiliate_id,
        customer_email: ref.customer_email,
        customer_name: ref.customer_name,
        status: ref.status,
        sharetribe_validation_status: ref.sharetribe_validation_status,
        created_at: ref.created_at
      })),
      affiliates: affiliates?.map(aff => ({
        id: aff.id,
        user_id: aff.user_id,
        name: aff.name,
        email: aff.email
      }))
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