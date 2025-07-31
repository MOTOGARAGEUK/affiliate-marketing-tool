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

    // Try both APIs to see which one works
    console.log('Testing Sharetribe APIs...');
    console.log('Marketplace Client ID:', marketplaceClientId.substring(0, 8) + '...');
    console.log('Integration Client ID:', integrationClientId.substring(0, 8) + '...');

    // First try the Integration API authentication endpoint
    const integrationAuthResponse = await fetch('https://flex-integ-api.sharetribe.com/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: integrationClientId,
        client_secret: integrationClientSecret,
      }),
    });

    console.log('Integration auth response status:', integrationAuthResponse.status);

    if (integrationAuthResponse.ok) {
      const integrationAuthData = await integrationAuthResponse.json();
      console.log('Integration API authentication successful');
      
      // Test Integration API with marketplace show endpoint
      const integrationApiResponse = await fetch('https://flex-integ-api.sharetribe.com/v1/integration_api/marketplace/show', {
        method: 'GET',
        headers: {
          'Authorization': `bearer ${integrationAuthData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Integration API response status:', integrationApiResponse.status);

      if (integrationApiResponse.ok) {
        const integrationApiData = await integrationApiResponse.json();
        console.log('Integration API call successful');
        
        return NextResponse.json({
          success: true,
          message: '✅ SUCCESS! Your Sharetribe Integration API credentials are working!',
          apiType: 'Integration API',
          hasAccessToken: !!integrationAuthData.access_token,
          tokenType: integrationAuthData.token_type,
          expiresIn: integrationAuthData.expires_in,
          marketplaceData: integrationApiData,
          suggestion: 'Your Integration API credentials are valid and can access the marketplace'
        });
      }
    }

    // If Integration API failed, try Marketplace API
    console.log('Trying Marketplace API...');
    const marketplaceAuthResponse = await fetch('https://flex-api.sharetribe.com/v1/auth/token', {
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

    console.log('Marketplace auth response status:', marketplaceAuthResponse.status);
    console.log('Marketplace auth response ok:', marketplaceAuthResponse.ok);

    if (marketplaceAuthResponse.ok) {
      const marketplaceAuthData = await marketplaceAuthResponse.json();
      console.log('Marketplace API authentication successful');
      
      // Try a simpler endpoint for Marketplace API
      const marketplaceApiResponse = await fetch('https://flex-api.sharetribe.com/v1/marketplace/show', {
        method: 'GET',
        headers: {
          'Authorization': `bearer ${marketplaceAuthData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Marketplace API response status:', marketplaceApiResponse.status);

      if (marketplaceApiResponse.ok) {
        const marketplaceApiData = await marketplaceApiResponse.json();
        console.log('Marketplace API call successful');
        
        return NextResponse.json({
          success: true,
          message: '✅ SUCCESS! Your Sharetribe Marketplace API credentials are working!',
          apiType: 'Marketplace API',
          hasAccessToken: !!marketplaceAuthData.access_token,
          tokenType: marketplaceAuthData.token_type,
          expiresIn: marketplaceAuthData.expires_in,
          marketplaceData: marketplaceApiData,
          suggestion: 'Your Marketplace API credentials are valid and can access the marketplace'
        });
      } else {
        const errorText = await marketplaceApiResponse.text();
        console.error('Marketplace API call failed:', errorText);
        
        return NextResponse.json({
          success: false,
          message: `❌ Both APIs failed. Integration API: ${integrationAuthResponse.status}, Marketplace API: ${marketplaceApiResponse.status}`,
          details: {
            integrationAuth: integrationAuthResponse.status,
            marketplaceAuth: marketplaceAuthResponse.status,
            marketplaceApi: marketplaceApiResponse.status,
            marketplaceError: errorText
          },
          suggestion: 'Please check your API credentials and permissions in Sharetribe Admin'
        }, { status: 400 });
      }
    } else {
      const errorText = await marketplaceAuthResponse.text();
      console.error('Marketplace authentication failed:', errorText);
      
      return NextResponse.json({
        success: false,
        message: `❌ Both APIs failed. Integration API: ${integrationAuthResponse.status}, Marketplace API: ${marketplaceAuthResponse.status}`,
        details: {
          integrationAuth: integrationAuthResponse.status,
          marketplaceAuth: marketplaceAuthResponse.status,
          marketplaceError: errorText
        },
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