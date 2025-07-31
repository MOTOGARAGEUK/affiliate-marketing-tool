import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    console.log('Testing Sharetribe credentials...');
    console.log('Client ID length:', clientId.length);
    console.log('Client Secret length:', clientSecret.length);

    // Test the OAuth token request
    const response = await fetch('https://auth.sharetribe.com/oauth/token', {
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

    console.log('Token response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Token received successfully');
      
      return NextResponse.json({
        success: true,
        message: '✅ Credentials are valid! Token received successfully.',
        hasToken: !!data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in
      });
    } else {
      const errorText = await response.text();
      console.error('Token request failed:', errorText);
      
      return NextResponse.json({
        success: false,
        message: `❌ Invalid credentials: ${response.status} ${response.statusText}`,
        details: errorText,
        suggestion: 'Please check your Client ID and Client Secret. Make sure they are correct and have the necessary API permissions.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: '❌ Network error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 