import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST REFERRAL TRACKING ===');
    
    const body = await request.json();
    console.log('Test request body:', body);
    
    const { referralCode, customerEmail, customerName, action } = body;
    
    if (!referralCode || !customerEmail || !customerName || !action) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Find the affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select(`
        id,
        user_id,
        name as affiliate_name,
        email as affiliate_email,
        referral_code,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('referral_code', referralCode)
      .single();
    
    console.log('Affiliate lookup result:', { affiliate, error: affiliateError });
    
    if (affiliateError || !affiliate) {
      console.log('❌ Affiliate not found for referral code:', referralCode);
      return NextResponse.json(
        { success: false, message: 'Affiliate not found', referralCode },
        { status: 404 }
      );
    }
    
    console.log('✅ Found affiliate:', affiliate.affiliate_name);
    
    // Check if this customer has already been tracked
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id, customer_email, created_at')
      .eq('affiliate_id', affiliate.id)
      .eq('customer_email', customerEmail.toLowerCase().trim())
      .maybeSingle();
    
    console.log('Existing referral check:', { existingReferral, error: checkError });
    
    if (existingReferral) {
      console.log('Customer already tracked for this affiliate');
      return NextResponse.json(
        { success: false, message: 'Customer already tracked', existingReferral },
        { status: 409 }
      );
    }
    
    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        user_id: affiliate.user_id,
        affiliate_id: affiliate.id,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_name: customerName,
        signup_date: new Date().toISOString(),
        listings_count: 1,
        purchases_count: 0,
        total_revenue: 0,
        status: 'pending',
        commission_earned: 0
      })
      .select()
      .single();
    
    console.log('Referral creation result:', { referral, error: referralError });
    
    if (referralError) {
      console.error('❌ Error creating referral:', referralError);
      return NextResponse.json(
        { success: false, message: 'Error creating referral', error: referralError },
        { status: 500 }
      );
    }
    
    console.log('✅ Test referral tracked successfully');
    console.log('=== END TEST REFERRAL TRACKING ===');
    
    return NextResponse.json({
      success: true,
      message: 'Test referral tracked successfully',
      referral: {
        id: referral.id,
        affiliate_name: affiliate.affiliate_name,
        customer_name: customerName,
        customer_email: customerEmail,
        action: action,
        created_at: referral.created_at
      }
    });
    
  } catch (error) {
    console.error('❌ Test referral tracking error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 