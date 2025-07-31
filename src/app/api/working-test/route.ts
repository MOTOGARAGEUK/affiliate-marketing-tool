import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Working test endpoint called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { clientId, clientSecret } = body;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        message: 'Missing credentials',
        received: { clientId: !!clientId, clientSecret: !!clientSecret }
      }, { status: 400 });
    }

    console.log('Testing Sharetribe connection...');
    console.log('Client ID length:', clientId.length);
    console.log('Client Secret length:', clientSecret.length);

    // Test the OAuth token request
    const tokenResponse = await fetch('https://auth.sharetribe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      console.log('Token received successfully');
      
      return NextResponse.json({
        success: true,
        message: '✅ Credentials are valid! Token received successfully.',
        hasToken: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scopes: tokenData.scope || 'No scopes listed'
      });
    } else {
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
      
      return NextResponse.json({
        success: false,
        message: `❌ Invalid credentials: ${tokenResponse.status} ${tokenResponse.statusText}`,
        details: errorText,
        suggestion: 'Please check your Client ID and Client Secret.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Unexpected error in working test:', error);
    return NextResponse.json(
      { 
        success: false,
        message: '❌ Server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 