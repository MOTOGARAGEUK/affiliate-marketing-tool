import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== GA MEASUREMENT PROTOCOL ===');
    
    const body = await request.json();
    const { 
      eventName, 
      userId, 
      userEmail, 
      userName, 
      utmSource, 
      utmMedium, 
      utmCampaign,
      transactionId,
      value,
      currency = 'GBP'
    } = body;
    
    console.log('Event data:', { eventName, userId, utmSource, utmCampaign });
    
    // Only process affiliate referrals
    if (utmSource !== 'affiliate' || !utmCampaign) {
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
      .eq('referral_code', utmCampaign)
      .single();
    
    if (affiliateError || !affiliate) {
      console.log('❌ Affiliate not found for referral code:', utmCampaign);
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found affiliate:', affiliate.affiliate_name);
    
    // Process different event types
    if (eventName === 'sign_up') {
      // Handle signup event
      if (!userEmail || !userName) {
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
        .eq('customer_email', userEmail.toLowerCase().trim())
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
          customer_email: userEmail.toLowerCase().trim(),
          customer_name: userName,
          signup_date: new Date().toISOString(),
          listings_count: 1,
          purchases_count: 0,
          total_revenue: 0,
          status: 'pending',
          commission_earned: 0
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
      
    } else if (eventName === 'purchase') {
      // Handle purchase event
      if (!transactionId || !value) {
        console.log('❌ Missing transaction information');
        return NextResponse.json(
          { success: false, message: 'Missing transaction information' },
          { status: 400 }
        );
      }
      
      // Find existing referral for this customer
      const { data: existingReferral, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .eq('customer_email', userEmail?.toLowerCase().trim())
        .maybeSingle();
      
      if (referralError) {
        console.error('❌ Error finding referral:', referralError);
        return NextResponse.json(
          { success: false, message: 'Error finding referral' },
          { status: 500 }
        );
      }
      
      if (!existingReferral) {
        console.log('❌ No existing referral found for purchase');
        return NextResponse.json(
          { success: false, message: 'No existing referral found' },
          { status: 404 }
        );
      }
      
      // Calculate commission based on program type
      const program = affiliate.programs[0];
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
    
    console.log('=== END GA MEASUREMENT PROTOCOL ===');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ GA Measurement Protocol error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 