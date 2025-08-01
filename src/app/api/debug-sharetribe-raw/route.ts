import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create an authenticated client with the user's token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Debugging ShareTribe API for user:', user.id);

    // Get ShareTribe credentials
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(user.id);

    if (!credentials) {
      return NextResponse.json({
        success: false,
        message: 'ShareTribe credentials not found'
      }, { status: 404 });
    }

    console.log('ShareTribe credentials found:', {
      clientId: credentials.clientId ? 'Set' : 'Not set',
      clientSecret: credentials.clientSecret ? 'Set' : 'Not set',
      marketplaceUrl: credentials.marketplaceUrl || 'Not set'
    });

    // Step 1: Get access token
    console.log('Step 1: Getting access token...');
    
    // Use dev auth URL since user is testing in dev environment
    const authUrl = 'https://auth.dev.sharetribe.com/oauth/token';
    
    console.log('Using auth URL:', authUrl);
    console.log('Marketplace URL:', credentials.marketplaceUrl);
    
    const tokenResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
    });

    console.log('Token response status:', tokenResponse.status, tokenResponse.statusText);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
      return NextResponse.json({
        success: false,
        message: 'Failed to get access token',
        tokenStatus: tokenResponse.status,
        tokenStatusText: tokenResponse.statusText,
        tokenError: errorText
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token response data:', { 
      access_token: tokenData.access_token ? 'Received' : 'Missing', 
      expires_in: tokenData.expires_in 
    });

    if (!tokenData.access_token) {
      return NextResponse.json({
        success: false,
        message: 'No access token received',
        tokenData: tokenData
      }, { status: 500 });
    }

    // Step 2: Test marketplace endpoint
    console.log('Step 2: Testing marketplace endpoint...');
    const marketplaceUrl = 'https://api.dev.sharetribe.com/v1/integration_api/marketplace/show';
    
    const marketplaceResponse = await fetch(marketplaceUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Marketplace response status:', marketplaceResponse.status, marketplaceResponse.statusText);
    
    if (!marketplaceResponse.ok) {
      const errorText = await marketplaceResponse.text();
      console.error('Marketplace request failed:', errorText);
      return NextResponse.json({
        success: false,
        message: 'Marketplace request failed',
        marketplaceStatus: marketplaceResponse.status,
        marketplaceStatusText: marketplaceResponse.statusText,
        marketplaceError: errorText,
        tokenData: { access_token: 'Received', expires_in: tokenData.expires_in }
      }, { status: 500 });
    }

    const marketplaceData = await marketplaceResponse.json();
    console.log('Marketplace response data:', marketplaceData);

    // Step 3: Test users endpoint
    console.log('Step 3: Testing users endpoint...');
    const usersUrl = 'https://api.dev.sharetribe.com/v1/integration_api/users/query?limit=10';
    
    const usersResponse = await fetch(usersUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Users response status:', usersResponse.status, usersResponse.statusText);
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('Users request failed:', errorText);
      return NextResponse.json({
        success: false,
        message: 'Users request failed',
        usersStatus: usersResponse.status,
        usersStatusText: usersResponse.statusText,
        usersError: errorText,
        marketplaceData: marketplaceData,
        tokenData: { access_token: 'Received', expires_in: tokenData.expires_in }
      }, { status: 500 });
    }

    const usersData = await usersResponse.json();
    console.log('Users response data:', usersData);

    return NextResponse.json({
      success: true,
      message: 'Raw API responses captured',
      tokenData: { access_token: 'Received', expires_in: tokenData.expires_in },
      marketplaceData: marketplaceData,
      usersData: usersData,
      credentials: {
        clientId: credentials.clientId ? 'Set' : 'Not set',
        clientSecret: credentials.clientSecret ? 'Set' : 'Not set',
        marketplaceUrl: credentials.marketplaceUrl || 'Not set'
      }
    });

  } catch (error) {
    console.error('Debug ShareTribe API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 