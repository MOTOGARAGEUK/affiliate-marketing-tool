import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== GA4 UTM CAPTURE WEBHOOK ===');
    
    const body = await request.json();
    console.log('Webhook payload:', JSON.stringify(body, null, 2));
    
    // Handle different GA4 webhook formats
    let eventData = null;
    
    if (body.events && Array.isArray(body.events)) {
      // GA4 webhook format
      eventData = body.events[0];
    } else if (body.event_name) {
      // Direct event format
      eventData = body;
    } else {
      console.log('Unknown webhook format');
      return NextResponse.json({ success: true, message: 'Unknown format' });
    }
    
    if (!eventData) {
      console.log('No event data found');
      return NextResponse.json({ success: true, message: 'No event data' });
    }
    
    // Extract UTM parameters
    const utmParams = eventData.event_params || eventData.parameters || [];
    const utmCampaign = utmParams.find((param: any) => param.key === 'utm_campaign' || param.name === 'utm_campaign')?.value;
    const utmSource = utmParams.find((param: any) => param.key === 'utm_source' || param.name === 'utm_source')?.value;
    const utmMedium = utmParams.find((param: any) => param.key === 'utm_medium' || param.name === 'utm_medium')?.value;
    
    console.log('UTM Campaign (referral code):', utmCampaign);
    console.log('UTM Source:', utmSource);
    console.log('UTM Medium:', utmMedium);
    
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
    
    // Store UTM tracking data
    const { data: utmTracking, error: utmError } = await supabase
      .from('utm_tracking')
      .insert({
        user_pseudo_id: eventData.user_pseudo_id || 'unknown',
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        event_name: eventData.event_name || 'page_view',
        event_timestamp: eventData.event_timestamp || new Date().toISOString(),
        user_email: eventData.user_properties?.find((prop: any) => prop.key === 'user_email')?.value || null,
        user_name: eventData.user_properties?.find((prop: any) => prop.key === 'user_name')?.value || null,
        processed: false
      })
      .select()
      .single();
    
    if (utmError) {
      console.error('❌ Error storing UTM data:', utmError);
      return NextResponse.json(
        { success: false, message: 'Error storing UTM data' },
        { status: 500 }
      );
    }
    
    console.log('✅ UTM data stored successfully');
    
    // Process different event types
    if (eventData.event_name === 'sign_up' || eventData.event_name === 'user_signup') {
      // Handle signup event
      const userEmail = eventData.user_properties?.find((prop: any) => prop.key === 'user_email')?.value;
      const userName = eventData.user_properties?.find((prop: any) => prop.key === 'user_name')?.value;
      
      if (userEmail) {
        // Check if this customer has already been tracked
        const { data: existingReferral, error: checkError } = await supabase
          .from('referrals')
          .select('id')
          .eq('affiliate_id', affiliate.id)
          .eq('customer_email', userEmail.toLowerCase().trim())
          .maybeSingle();
        
        if (!existingReferral) {
          // Create referral record
          const { data: referral, error: referralError } = await supabase
            .from('referrals')
            .insert({
              user_id: affiliate.user_id,
              affiliate_id: affiliate.id,
              customer_email: userEmail.toLowerCase().trim(),
              customer_name: userName || 'Unknown',
              signup_date: new Date().toISOString(),
              listings_count: 1,
              purchases_count: 0,
              total_revenue: 0,
              status: 'pending',
              commission: 0
            })
            .select()
            .single();
          
          if (referralError) {
            console.error('❌ Error creating referral:', referralError);
          } else {
            console.log('✅ Signup referral created successfully');
          }
        } else {
          console.log('Customer already tracked for this affiliate');
        }
      }
    }
    
    console.log('=== END GA4 UTM CAPTURE WEBHOOK ===');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ GA4 UTM capture webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 