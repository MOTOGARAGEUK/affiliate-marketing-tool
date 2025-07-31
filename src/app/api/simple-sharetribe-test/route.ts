import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Simple Sharetribe test endpoint called');
    
    const body = await request.json();
    console.log('Request body received:', { 
      hasClientId: !!body.clientId, 
      hasClientSecret: !!body.clientSecret,
      hasAccessToken: !!body.accessToken,
      hasApiUrl: !!body.apiUrl
    });
    
    const { clientId, clientSecret, accessToken, apiUrl = 'https://flex-api.sharetribe.com/v1' } = body;
    
    // Determine which API type to use
    const useIntegrationAPI = !!accessToken;
    const useMarketplaceAPI = !!clientId && !!clientSecret;
    
    if (!useIntegrationAPI && !useMarketplaceAPI) {
      return NextResponse.json({
        success: false,
        message: 'Missing credentials. Please provide either Client ID + Client Secret (Marketplace API) or Access Token (Integration API)',
        received: { 
          hasClientId: !!clientId, 
          hasClientSecret: !!clientSecret,
          hasAccessToken: !!accessToken
        }
      }, { status: 400 });
    }

    if (useIntegrationAPI) {
      console.log('Testing Sharetribe Integration API with Access Token...');
      console.log('Access Token:', accessToken.substring(0, 8) + '...');
      
      // Test Integration API with access token
      const apiResponse = await fetch(`${apiUrl}/integration_api/marketplace/show`, {
        method: 'GET',
        headers: {
          'Authorization': `bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Integration API response status:', apiResponse.status);

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('Integration API call successful');
        
        return NextResponse.json({
          success: true,
          message: '✅ SUCCESS! Your Sharetribe Integration API access token is working!',
          apiType: 'Integration API',
          marketplaceData: apiData,
          suggestion: 'Your access token is valid and can access the Integration API'
        });
      } else {
        const errorText = await apiResponse.text();
        console.error('Integration API call failed:', errorText);
        
        return NextResponse.json({
          success: false,
          message: `❌ Integration API call failed: ${apiResponse.status} ${apiResponse.statusText}`,
          details: errorText,
          suggestion: 'Please check your access token in Sharetribe Admin'
        }, { status: 400 });
      }
    } else {
      console.log('Testing Sharetribe Marketplace API...');
      console.log('Client ID:', clientId.substring(0, 8) + '...');
      console.log('Client Secret:', clientSecret.substring(0, 8) + '...');

      // Try the Marketplace API authentication endpoint
      const authResponse = await fetch(`${apiUrl}/auth/token`, {
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
        const apiResponse = await fetch(`${apiUrl}/users/query`, {
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