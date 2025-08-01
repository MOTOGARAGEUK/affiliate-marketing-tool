import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import sharetribeIntegrationSdk from 'sharetribe-flex-integration-sdk';

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

    // Create SDK instance
    console.log('Creating ShareTribe SDK instance...');
    const sdk = sharetribeIntegrationSdk.createInstance({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret
    });

    // Step 1: Test marketplace endpoint
    console.log('Step 1: Testing marketplace endpoint...');
    let marketplaceData = null;
    try {
      const marketplaceResponse = await sdk.marketplace.show();
      console.log('Marketplace response:', marketplaceResponse);
      
      if (marketplaceResponse.data && marketplaceResponse.data.data) {
        marketplaceData = marketplaceResponse.data.data;
        console.log('Marketplace data:', marketplaceData);
      }
    } catch (marketplaceError) {
      console.error('Marketplace request failed:', marketplaceError);
      return NextResponse.json({
        success: false,
        message: 'Marketplace request failed',
        marketplaceError: marketplaceError instanceof Error ? marketplaceError.message : 'Unknown error',
        credentials: {
          clientId: credentials.clientId ? 'Set' : 'Not set',
          clientSecret: credentials.clientSecret ? 'Set' : 'Not set',
          marketplaceUrl: credentials.marketplaceUrl || 'Not set'
        }
      }, { status: 500 });
    }

    // Step 2: Test users endpoint
    console.log('Step 2: Testing users endpoint...');
    let usersData = null;
    try {
      const usersResponse = await sdk.users.query({ perPage: 10 });
      console.log('Users response:', usersResponse);
      
      if (usersResponse.data && usersResponse.data.data) {
        usersData = usersResponse.data;
        console.log('Users data:', usersData);
      }
    } catch (usersError) {
      console.error('Users request failed:', usersError);
      return NextResponse.json({
        success: false,
        message: 'Users request failed',
        usersError: usersError instanceof Error ? usersError.message : 'Unknown error',
        marketplaceData: marketplaceData,
        credentials: {
          clientId: credentials.clientId ? 'Set' : 'Not set',
          clientSecret: credentials.clientSecret ? 'Set' : 'Not set',
          marketplaceUrl: credentials.marketplaceUrl || 'Not set'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Raw API responses captured using official SDK',
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