import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST REFERRAL ENDPOINT ===');
    
    const body = await request.json();
    console.log('Test request body:', body);
    
    const { referralCode, customerEmail, customerName } = body;
    
    // Check cookies
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header:', cookieHeader);
    
    let cookieReferralCode = null;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      cookieReferralCode = cookies.referralCode;
      console.log('Referral code from cookies:', cookieReferralCode);
    }
    
    // Check if referral code exists in database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, name, referral_code, user_id')
      .eq('referral_code', referralCode || cookieReferralCode)
      .maybeSingle();
    
    console.log('Database lookup result:', { affiliate, error: affiliateError });
    
    return NextResponse.json({
      success: true,
      testData: {
        providedReferralCode: referralCode,
        cookieReferralCode: cookieReferralCode,
        affiliateFound: !!affiliate,
        affiliate: affiliate ? {
          id: affiliate.id,
          name: affiliate.name,
          referral_code: affiliate.referral_code
        } : null,
        error: affiliateError
      }
    });
    
  } catch (error) {
    console.error('Test referral error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 