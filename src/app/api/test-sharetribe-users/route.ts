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

    console.log('Fetching ShareTribe users for user:', user.id);

    // Get ShareTribe credentials
    const { getSharetribeCredentials, createSharetribeAPI } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(user.id);

    if (!credentials) {
      return NextResponse.json({
        success: false,
        message: 'ShareTribe credentials not found'
      }, { status: 404 });
    }

    console.log('ShareTribe credentials found, creating API instance');

    const sharetribeAPI = createSharetribeAPI(credentials);
    
    // Test connection first
    console.log('Testing ShareTribe connection...');
    const connectionTest = await sharetribeAPI.testConnection();
    console.log('Connection test result:', connectionTest);
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        message: 'ShareTribe API connection failed'
      }, { status: 500 });
    }

    console.log('ShareTribe connection successful, fetching users...');
    
    // First, let's get marketplace info to confirm we're connected to the right place
    console.log('🔍 Getting marketplace info...');
    const marketplaceInfo = await sharetribeAPI.getMarketplaceInfo();
    console.log('✅ Marketplace info:', marketplaceInfo);
    
    // Get users from ShareTribe (limit to 10 for testing)
    console.log('🔍 Fetching users from ShareTribe...');
    const users = await sharetribeAPI.getUsers(10, 0);
    console.log('Users API response:', users);
    
    if (!users) {
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch users from ShareTribe API'
      }, { status: 500 });
    }

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found in ShareTribe marketplace',
        users: [],
        marketplace: marketplaceInfo,
        instructions: 'Your ShareTribe marketplace appears to be empty. You may need to create some test users first.'
      });
    }

    // Format user data for display
    const userList = users.map(user => ({
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName || user.attributes?.profile?.displayName || 'No name',
      createdAt: user.createdAt,
      hasReferralCode: !!(user.attributes?.referralCode || user.attributes?.affiliateCode)
    }));

    return NextResponse.json({
      success: true,
      message: `Found ${users.length} users in ShareTribe marketplace`,
      users: userList,
      marketplace: marketplaceInfo,
      instructions: 'Use one of these email addresses to test the sync functionality'
    });

  } catch (error) {
    console.error('Error fetching ShareTribe users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 