import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== GA UTM CAPTURE WEBHOOK ===');
    
    const body = await request.json();
    console.log('GA webhook payload:', body);
    
    // Extract UTM parameters from Google Analytics event
    const { 
      event_name, 
      event_timestamp, 
      user_pseudo_id,
      user_properties,
      event_parameters 
    } = body;
    
    // Get UTM parameters from event
    const utmSource = event_parameters?.find((param: any) => param.key === 'utm_source')?.value;
    const utmMedium = event_parameters?.find((param: any) => param.key === 'utm_medium')?.value;
    const utmCampaign = event_parameters?.find((param: any) => param.key === 'utm_campaign')?.value;
    
    console.log('UTM Parameters:', { utmSource, utmMedium, utmCampaign });
    
    // Only process affiliate referrals
    if (utmSource !== 'affiliate' || !utmCampaign) {
      console.log('Not an affiliate referral or missing campaign');
      return NextResponse.json({ success: true, message: 'Not an affiliate event' });
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Store UTM data for later sync with Sharetribe
    const { error: utmError } = await supabase
      .from('utm_tracking')
      .insert({
        user_pseudo_id: user_pseudo_id,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        event_name: event_name,
        event_timestamp: event_timestamp,
        user_email: user_properties?.find((prop: any) => prop.key === 'user_email')?.value,
        user_name: user_properties?.find((prop: any) => prop.key === 'user_name')?.value,
        processed: false
      });
    
    if (utmError) {
      console.error('❌ Error storing UTM data:', utmError);
      return NextResponse.json(
        { success: false, message: 'Error storing UTM data' },
        { status: 500 }
      );
    }
    
    console.log('✅ UTM data stored for later sync');
    console.log('=== END GA UTM CAPTURE WEBHOOK ===');
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ GA UTM capture webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 