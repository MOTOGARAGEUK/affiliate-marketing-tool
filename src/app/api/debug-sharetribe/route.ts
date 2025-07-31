import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    console.log('Debug: Testing Sharetribe credentials...');
    console.log('Debug: Client ID length:', clientId.length);
    console.log('Debug: Client Secret length:', clientSecret.length);

    // Test the OAuth token request directly
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

    console.log('Debug: Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Debug: Token request failed:', errorText);
      
      return NextResponse.json({
        error: 'Failed to get access token',
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        details: errorText,
        suggestion: 'Please check your Client ID and Client Secret. Make sure they are correct and have the necessary API permissions.'
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    console.log('Debug: Token received successfully');

    // Test API access
    const apiResponse = await fetch('https://api.sharetribe.com/v1/users?limit=1', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Debug: API response status:', apiResponse.status);

    if (!apiResponse.ok) {
      const apiErrorText = await apiResponse.text();
      console.error('Debug: API request failed:', apiErrorText);
      
      return NextResponse.json({
        error: 'Failed to access Sharetribe API',
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        details: apiErrorText,
        suggestion: 'Token was received but API access failed. Check your API permissions.'
      }, { status: 400 });
    }

    const apiData = await apiResponse.json();
    console.log('Debug: API access successful');

    return NextResponse.json({
      success: true,
      message: 'Sharetribe API connection successful',
      tokenReceived: !!tokenData.access_token,
      apiAccess: true,
      userCount: apiData.data?.length || 0
    });

  } catch (error) {
    console.error('Debug: Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 