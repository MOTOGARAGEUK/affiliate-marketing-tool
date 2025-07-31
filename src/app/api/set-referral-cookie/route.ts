import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get('ref');
    const redirectUrl = searchParams.get('redirect') || 'https://test.moto-garage.co.uk/signup';
    
    console.log('=== SET REFERRAL COOKIE DEBUG ===');
    console.log('Referral code:', referralCode);
    console.log('Redirect URL:', redirectUrl);
    
    if (!referralCode) {
      console.log('❌ No referral code provided');
      return NextResponse.redirect(redirectUrl);
    }
    
    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl);
    
    // Set cookie that expires in 30 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    
    // Set the referral code cookie
    response.cookies.set('referralCode', referralCode, {
      expires: expires,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false // Allow JavaScript access
    });
    
    console.log('✅ Cookie set successfully');
    console.log('=== END SET REFERRAL COOKIE DEBUG ===');
    
    return response;
    
  } catch (error) {
    console.error('Error setting referral cookie:', error);
    return NextResponse.redirect('https://test.moto-garage.co.uk/signup');
  }
} 