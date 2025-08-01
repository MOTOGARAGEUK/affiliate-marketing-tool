import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSharetribeCredentials, createSharetribeAPI } from '@/lib/sharetribe';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    // Get ShareTribe credentials
    const credentials = await getSharetribeCredentials(authUser.id);
    if (!credentials) {
      return NextResponse.json({ success: false, message: 'No ShareTribe credentials found' }, { status: 400 });
    }

    const sharetribeAPI = createSharetribeAPI(credentials);

    // Test connection first
    console.log('🔍 Testing ShareTribe connection...');
    const connectionTest = await sharetribeAPI.testConnection();
    if (!connectionTest) {
      return NextResponse.json({ success: false, message: 'ShareTribe connection failed' }, { status: 500 });
    }

    console.log('✅ ShareTribe connection successful');

    // Get all users from ShareTribe
    console.log('🔍 Fetching all users from ShareTribe...');
    const users = await sharetribeAPI.getUsers(100);
    console.log(`✅ Found ${users.length} users in ShareTribe`);

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No users found in ShareTribe marketplace'
      });
    }

    // Get listings count for each user
    console.log('🔍 Fetching listings count for each user...');
    const usersWithListings = [];

    for (const user of users) {
      try {
        console.log(`📋 Getting listings for user: ${user.email}`);
        const listings = await sharetribeAPI.getUserListings(user.id, 1000);
        
        const activeListings = listings.filter(listing => {
          const state = listing.attributes?.state || listing.state;
          return state === 'published' || state === 'active';
        });

        usersWithListings.push({
          id: user.id,
          email: user.email,
          displayName: user.profile?.displayName || 'No name',
          listingsCount: activeListings.length,
          totalListings: listings.length,
          createdAt: user.createdAt
        });

        console.log(`✅ User ${user.email}: ${activeListings.length} active listings, ${listings.length} total`);
      } catch (error) {
        console.error(`❌ Error getting listings for user ${user.email}:`, error);
        usersWithListings.push({
          id: user.id,
          email: user.email,
          displayName: user.profile?.displayName || 'No name',
          listingsCount: 0,
          totalListings: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          createdAt: user.createdAt
        });
      }
    }

    console.log('✅ Completed fetching listings for all users');

    return NextResponse.json({
      success: true,
      message: `Found ${users.length} users in ShareTribe marketplace`,
      totalUsers: users.length,
      users: usersWithListings
    });

  } catch (error) {
    console.error('Error fetching ShareTribe users:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch ShareTribe users',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 