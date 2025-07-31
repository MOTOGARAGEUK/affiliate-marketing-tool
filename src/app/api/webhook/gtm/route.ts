import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== GTM WEBHOOK DEBUG ===');
    
    const body = await request.json();
    console.log('GTM webhook payload:', body);
    
    // Extract data from GTM webhook
    const { 
      event,
      event_time,
      user_id,
      user_email,
      user_name,
      utm_source,
      utm_medium,
      utm_campaign,
      transaction_id,
      value,
      currency
    } = body;
    
    console.log('Event:', event);
    console.log('UTM Campaign (referral code):', utm_campaign);
    console.log('UTM Source:', utm_source);
    
    // Only process affiliate referrals
    if (utm_source !== 'affiliate' || !utm_campaign) {
      console.log('Not an affiliate referral or missing campaign');
      return NextResponse.json({ success: true, message: 'Not an affiliate event' });
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
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('referral_code', utm_campaign)
      .single();
    
    if (affiliateError || !affiliate) {
      console.log('❌ Affiliate not found for referral code:', utm_campaign);
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found affiliate:', affiliate.affiliate_name);
    
    // Process different event types
    if (event === 'sign_up') {
      // Handle signup event
      if (!user_email || !user_name) {
        console.log('❌ Missing user email or name');
        return NextResponse.json(
          { success: false, message: 'Missing user information' },
          { status: 400 }
        );
      }
      
      // Check if this customer has already been tracked
      const { data: existingReferral, error: checkError } = await supabase
        .from('referrals')
        .select('id')
        .eq('affiliate_id', affiliate.id)
        .eq('customer_email', user_email.toLowerCase().trim())
        .maybeSingle();
      
      if (existingReferral) {
        console.log('Customer already tracked for this affiliate');
        return NextResponse.json(
          { success: false, message: 'Customer already tracked' },
          { status: 409 }
        );
      }
      
      // Create referral record
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .insert({
          user_id: affiliate.user_id,
          affiliate_id: affiliate.id,
          customer_email: user_email.toLowerCase().trim(),
          customer_name: user_name,
          signup_date: new Date().toISOString(),
          listings_count: 1, // Default for new signup
          purchases_count: 0,
          total_revenue: 0,
          status: 'pending',
          commission_earned: 0 // Will be calculated when purchase occurs
        })
        .select()
        .single();
      
      if (referralError) {
        console.error('❌ Error creating referral:', referralError);
        return NextResponse.json(
          { success: false, message: 'Error creating referral' },
          { status: 500 }
        );
      }
      
      console.log('✅ Signup referral tracked successfully');
      
    } else if (event === 'purchase') {
      // Handle purchase event
      if (!transaction_id || !value) {
        console.log('❌ Missing transaction information');
        return NextResponse.json(
          { success: false, message: 'Missing transaction information' },
          { status: 400 }
        );
      }
      
      // Find existing referral for this affiliate and transaction
      const { data: existingReferral, error: checkError } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .eq('customer_email', user_email?.toLowerCase().trim())
        .maybeSingle();
      
      if (!existingReferral) {
        console.log('❌ No existing referral found for purchase');
        return NextResponse.json(
          { success: false, message: 'No existing referral found' },
          { status: 404 }
        );
      }
      
      // Calculate commission based on program type
      const program = affiliate.programs[0]; // Assuming one program per affiliate
      let commissionEarned = 0;
      
      if (program.commission_type === 'percentage') {
        commissionEarned = (parseFloat(value) * program.commission) / 100;
      } else {
        commissionEarned = program.commission;
      }
      
      // Update referral with purchase information
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          purchases_count: existingReferral.purchases_count + 1,
          total_revenue: existingReferral.total_revenue + parseFloat(value),
          commission_earned: existingReferral.commission_earned + commissionEarned,
          status: 'approved'
        })
        .eq('id', existingReferral.id);
      
      if (updateError) {
        console.error('❌ Error updating referral:', updateError);
        return NextResponse.json(
          { success: false, message: 'Error updating referral' },
          { status: 500 }
        );
      }
      
      console.log('✅ Purchase referral tracked successfully');
    }
    
    console.log('=== END GTM WEBHOOK DEBUG ===');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ GTM webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 