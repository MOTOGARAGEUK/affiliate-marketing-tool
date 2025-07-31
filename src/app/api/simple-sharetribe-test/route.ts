import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Simple Sharetribe test endpoint called');
    
    const body = await request.json();
    console.log('Request body received:', { 
      hasClientId: !!body.clientId, 
      hasClientSecret: !!body.clientSecret,
      hasAccessToken: !!body.accessToken,
      hasApiUrl: !!body.apiUrl,
      hasMarketplaceClientId: !!body.marketplaceClientId,
      hasMarketplaceClientSecret: !!body.marketplaceClientSecret,
      hasIntegrationClientId: !!body.integrationClientId,
      hasIntegrationClientSecret: !!body.integrationClientSecret,
      fullBody: body
    });
    
    // Handle both old and new field names for backward compatibility
    const marketplaceClientId = body.marketplaceClientId || body.clientId;
    const marketplaceClientSecret = body.marketplaceClientSecret || body.clientSecret;
    const integrationClientId = body.integrationClientId;
    const integrationClientSecret = body.integrationClientSecret;
    
    console.log('Processed credentials:', {
      hasMarketplaceClientId: !!marketplaceClientId,
      hasMarketplaceClientSecret: !!marketplaceClientSecret,
      hasIntegrationClientId: !!integrationClientId,
      hasIntegrationClientSecret: !!integrationClientSecret
    });
    
    // Check if we have the required credentials
    const hasMarketplaceAPI = !!marketplaceClientId && !!marketplaceClientSecret;
    const hasIntegrationAPI = !!integrationClientId && !!integrationClientSecret;
    
    if (!hasMarketplaceAPI) {
      return NextResponse.json({
        success: false,
        message: 'Missing Marketplace API credentials. Please provide Marketplace Client ID and Client Secret.',
        received: { 
          hasMarketplaceClientId: !!marketplaceClientId, 
          hasMarketplaceClientSecret: !!marketplaceClientSecret,
          oldFieldNames: { hasClientId: !!body.clientId, hasClientSecret: !!body.clientSecret }
        }
      }, { status: 400 });
    }

    console.log('Testing Sharetribe Marketplace API...');
    console.log('Marketplace Client ID:', marketplaceClientId.substring(0, 8) + '...');
    console.log('Marketplace Client Secret:', marketplaceClientSecret.substring(0, 8) + '...');

    // Try the Marketplace API authentication endpoint
    const authResponse = await fetch('https://flex-api.sharetribe.com/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: marketplaceClientId,
        client_secret: marketplaceClientSecret,
      }),
    });

    console.log('Auth response status:', authResponse.status);
    console.log('Auth response ok:', authResponse.ok);

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Authentication successful, got access token');
      
      // Now test the actual API call with the access token
      const apiResponse = await fetch('https://flex-api.sharetribe.com/v1/users/query', {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${authData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {},
          include: ['profile'],
          fields: {
            user: ['id', 'profile'],
            profile: ['displayName', 'email']
          }
        })
      });

      console.log('API response status:', apiResponse.status);

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('API call successful');
        
        return NextResponse.json({
          success: true,
          message: '✅ SUCCESS! Your Sharetribe Marketplace API credentials are working!',
          apiType: 'Marketplace API',
          hasAccessToken: !!authData.access_token,
          tokenType: authData.token_type,
          expiresIn: authData.expires_in,
          usersCount: apiData.data?.length || 0,
          suggestion: 'Your credentials are valid and can access the Marketplace API'
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