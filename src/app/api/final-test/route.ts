import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = await request.json();
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        message: 'Missing credentials'
      }, { status: 400 });
    }

    console.log('Testing with credentials:', { 
      clientId: clientId.substring(0, 8) + '...', 
      clientSecret: clientSecret.substring(0, 8) + '...' 
    });

    // Try the correct Sharetribe OAuth endpoint
    const response = await fetch('https://api.sharetribe.com/oauth/token', {
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

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: '✅ SUCCESS! Your credentials are working!',
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scopes: data.scope || 'No scopes listed'
      });
    } else {
      const errorText = await response.text();
      console.error('OAuth failed:', errorText);
      
      return NextResponse.json({
        success: false,
        message: `❌ OAuth failed: ${response.status} ${response.statusText}`,
        details: errorText,
        suggestion: 'Please check your Client ID and Client Secret in Sharetribe Admin → Advanced → Applications'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 