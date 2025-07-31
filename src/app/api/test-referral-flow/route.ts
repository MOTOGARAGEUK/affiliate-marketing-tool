import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing referral flow...');
    const supabase = createServerClient();
    
    // Check UTM tracking table
    const { data: utmData, error: utmError } = await supabase
      .from('utm_tracking')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (utmError) {
      console.error('UTM tracking error:', utmError);
    }
    
    // Check affiliates table
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('*')
      .limit(10);
    
    if (affiliatesError) {
      console.error('Affiliates error:', affiliatesError);
    }
    
    // Check referrals table
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (referralsError) {
      console.error('Referrals error:', referralsError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Referral flow test completed',
      data: {
        utmTrackingCount: utmData?.length || 0,
        utmData: utmData || [],
        affiliatesCount: affiliates?.length || 0,
        affiliates: affiliates || [],
        referralsCount: referrals?.length || 0,
        referrals: referrals || []
      }
    });
    
  } catch (error) {
    console.error('Referral flow test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test referral flow',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Testing referral flow with POST...');
    const body = await request.json();
    const { testType = 'all' } = body;
    
    const supabase = createServerClient();
    
    if (testType === 'utm' || testType === 'all') {
      // Test UTM tracking by creating a test record
      const { data: utmTest, error: utmTestError } = await supabase
        .from('utm_tracking')
        .insert({
          user_pseudo_id: 'test-user-' + Date.now(),
          utm_source: 'affiliate',
          utm_medium: 'link',
          utm_campaign: 'test-campaign',
          event_name: 'page_view',
          event_timestamp: new Date().toISOString(),
          user_email: 'test@example.com',
          user_name: 'Test User',
          processed: false
        })
        .select()
        .single();
      
      if (utmTestError) {
        console.error('UTM test insert error:', utmTestError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'UTM tracking test completed',
        utmTest: utmTest || null,
        utmError: utmTestError?.message || null
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Referral flow test completed'
    });
    
  } catch (error) {
    console.error('Referral flow test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test referral flow',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 