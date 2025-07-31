import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Simple Sharetribe test endpoint called');
    
    const body = await request.json();
    console.log('Request body received:', { 
      hasClientId: !!body.clientId, 
      hasClientSecret: !!body.clientSecret,
      clientIdLength: body.clientId?.length || 0,
      clientSecretLength: body.clientSecret?.length || 0
    });
    
    const { clientId, clientSecret } = body;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        message: 'Missing Client ID or Client Secret',
        received: { clientId: !!clientId, clientSecret: !!clientSecret }
      }, { status: 400 });
    }

    console.log('Testing Sharetribe OAuth...');
    console.log('Client ID:', clientId.substring(0, 8) + '...');
    console.log('Client Secret:', clientSecret.substring(0, 8) + '...');

    // Test the OAuth token request - using the correct endpoint
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
    console.log('Token response ok:', tokenResponse.ok);

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      console.log('Token received successfully');
      
      return NextResponse.json({
        success: true,
        message: '✅ SUCCESS! Your Sharetribe credentials are working!',
        hasToken: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scopes: tokenData.scope || 'No scopes listed'
      });
    } else {
      const errorText = await tokenResponse.text();
      console.error('OAuth failed:', errorText);
      
      return NextResponse.json({
        success: false,
        message: `❌ OAuth failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
        details: errorText,
        suggestion: 'Please check your Client ID and Client Secret in Sharetribe Admin → Advanced → Applications'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Unexpected error in simple test:', error);
    return NextResponse.json(
      { 
        success: false,
        message: '❌ Server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 