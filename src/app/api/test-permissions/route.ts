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

    console.log('Testing Sharetribe application permissions...');

    // First, get the access token
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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
      
      return NextResponse.json({
        success: false,
        message: `❌ Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`,
        details: errorText,
        suggestion: 'Check if your application has the correct scopes/permissions configured.'
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token received successfully');
    console.log('Token scopes:', tokenData.scope);

    // Test different API endpoints to see what works
    const testEndpoints = [
      { name: 'Users', url: 'https://api.sharetribe.com/v1/users?limit=1' },
      { name: 'Listings', url: 'https://api.sharetribe.com/v1/listings?limit=1' },
      { name: 'Transactions', url: 'https://api.sharetribe.com/v1/transactions?limit=1' },
      { name: 'Marketplace Info', url: 'https://api.sharetribe.com/v1/marketplace' }
    ];

    const results = [];

    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        results.push({
          endpoint: endpoint.name,
          status: response.status,
          success: response.ok,
          message: response.ok ? '✅ Access granted' : `❌ ${response.status} ${response.statusText}`
        });

        console.log(`${endpoint.name}: ${response.status}`);
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          status: 'ERROR',
          success: false,
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application permissions test completed',
      tokenReceived: !!tokenData.access_token,
      scopes: tokenData.scope || 'No scopes listed',
      endpointTests: results,
      suggestion: results.some(r => r.success) 
        ? 'Some endpoints work! Your application has partial access.'
        : 'No endpoints work. Your application may need additional scopes/permissions.'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: '❌ Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 