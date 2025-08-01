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

    console.log('Testing basic ShareTribe connection for user:', user.id);

    // Get ShareTribe credentials
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(user.id);

    if (!credentials) {
      return NextResponse.json({
        success: false,
        message: 'ShareTribe credentials not found',
        details: 'No ShareTribe settings found in database'
      }, { status: 404 });
    }

    console.log('ShareTribe credentials found:', {
      clientId: credentials.clientId ? 'Set' : 'Not set',
      clientSecret: credentials.clientSecret ? 'Set' : 'Not set',
      marketplaceUrl: credentials.marketplaceUrl || 'Not set'
    });

    // Test basic connection
    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI(credentials);

    console.log('Testing ShareTribe connection...');
    const connectionTest = await sharetribeAPI.testConnection();
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        message: 'ShareTribe connection failed',
        details: 'Could not connect to ShareTribe API'
      }, { status: 500 });
    }

    console.log('ShareTribe connection successful');

    // Get marketplace info
    const marketplaceInfo = await sharetribeAPI.getMarketplaceInfo();
    
    if (!marketplaceInfo) {
      return NextResponse.json({
        success: false,
        message: 'Could not fetch marketplace info',
        details: 'Marketplace info request failed'
      }, { status: 500 });
    }

    // Get a few users to test user fetching
    const users = await sharetribeAPI.getUsers(5, 0);
    
    return NextResponse.json({
      success: true,
      message: 'Basic ShareTribe test successful',
      credentials: {
        clientId: credentials.clientId ? 'Set' : 'Not set',
        clientSecret: credentials.clientSecret ? 'Set' : 'Not set',
        marketplaceUrl: credentials.marketplaceUrl || 'Not set'
      },
      marketplace: marketplaceInfo,
      usersFound: users.length,
      sampleUsers: users.slice(0, 3).map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.profile?.displayName || 'No name'
      }))
    });

  } catch (error) {
    console.error('Basic ShareTribe test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 