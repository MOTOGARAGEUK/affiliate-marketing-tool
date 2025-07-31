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

    console.log('Testing Sharetribe Integration API...');
    console.log('Client ID:', clientId.substring(0, 8) + '...');
    console.log('Client Secret:', clientSecret.substring(0, 8) + '...');

    // Try the correct Sharetribe authentication endpoint
    const authResponse = await fetch('https://flex-integ-api.sharetribe.com/v1/auth/token', {
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

    console.log('Auth response status:', authResponse.status);
    console.log('Auth response ok:', authResponse.ok);

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Authentication successful, got access token');
      
      // Now test the actual API call with the access token
      const apiResponse = await fetch('https://flex-integ-api.sharetribe.com/v1/integration_api/marketplace/show', {
        method: 'GET',
        headers: {
          'Authorization': `bearer ${authData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API response status:', apiResponse.status);

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('API call successful');
        
        return NextResponse.json({
          success: true,
          message: '✅ SUCCESS! Your Sharetribe Integration API credentials are working!',
          hasAccessToken: !!authData.access_token,
          tokenType: authData.token_type,
          expiresIn: authData.expires_in,
          marketplaceData: apiData,
          suggestion: 'Your credentials are valid and can access the Integration API'
        });
      } else {
        const errorText = await apiResponse.text();
        console.error('API call failed:', errorText);
        
        return NextResponse.json({
          success: false,
          message: `❌ API call failed: ${apiResponse.status} ${apiResponse.statusText}`,
          details: errorText,
          suggestion: 'Authentication worked but API call failed. Check your application permissions.'
        }, { status: 400 });
      }
    } else {
      const errorText = await authResponse.text();
      console.error('Authentication failed:', errorText);
      
      return NextResponse.json({
        success: false,
        message: `❌ Authentication failed: ${authResponse.status} ${authResponse.statusText}`,
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