import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get referral code from cookies
    const cookieHeader = request.headers.get('cookie');
    let referralCode = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      referralCode = cookies.referralCode;
    }

    return NextResponse.json({
      success: true,
      referralCode: referralCode || null
    });
  } catch (error) {
    console.error('Error getting referral code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get referral code' },
      { status: 500 }
    );
  }
} 