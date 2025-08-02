import { NextRequest, NextResponse } from 'next/server';
import { createSharetribeAPI, getSharetribeCredentials } from '@/lib/sharetribe';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { createClient } = await import('@supabase/supabase-js');
    
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

    // Test connection
    console.log('🔍 Testing ShareTribe connection...');
    const connectionTest = await sharetribeAPI.testConnection();
    console.log('✅ Connection test result:', connectionTest);

    // Get marketplace info
    console.log('🔍 Getting marketplace info...');
    const marketplace = await sharetribeAPI.getMarketplaceInfo();
    console.log('✅ Marketplace info:', marketplace);

    // Get sample users
    console.log('🔍 Getting sample users...');
    const users = await sharetribeAPI.getUsers(5);
    console.log('✅ Sample users found:', users.length);

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No users found in ShareTribe marketplace'
      });
    }

    // Test with first user
    const testUser = users[0];
    console.log('🔍 Testing with user:', testUser.email);

    // Test individual components
    console.log('🔍 Testing getUserById...');
    const userById = await sharetribeAPI.getUserById(testUser.id);
    console.log('✅ getUserById result:', userById ? 'Success' : 'Failed');

    console.log('🔍 Testing getUserListings...');
    const listings = await sharetribeAPI.getUserListings(testUser.id);
    console.log('✅ getUserListings result:', listings.length, 'listings');

    console.log('🔍 Testing getUserTransactions...');
    const transactions = await sharetribeAPI.getUserTransactions(testUser.id);
    console.log('✅ getUserTransactions result:', transactions.length, 'transactions');

    // Test getUserStats step by step
    console.log('🔍 Testing getUserStats step by step...');
    try {
      const stats = await sharetribeAPI.getUserStats(testUser.id);
      console.log('✅ getUserStats result:', stats);
    } catch (statsError) {
      console.error('❌ getUserStats error:', statsError);
    }

    // Test specific email lookup
    console.log('🔍 Testing specific email lookup...');
    try {
      const jacobUser = await sharetribeAPI.getUserByEmail('maddren.jacob@gmail.com');
      console.log('✅ Jacob email lookup result:', jacobUser ? 'Found' : 'Not found');
      if (jacobUser) {
        console.log('✅ Jacob user details:', {
          id: jacobUser.id,
          email: jacobUser.email,
          displayName: jacobUser.profile?.displayName
        });
      }
    } catch (emailError) {
      console.error('❌ Email lookup error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Basic ShareTribe test successful',
      credentials: {
        clientId: credentials.clientId ? 'Set' : 'Not set',
        clientSecret: credentials.clientSecret ? 'Set' : 'Not set',
        marketplaceUrl: credentials.marketplaceUrl
      },
      marketplace: {
        id: marketplace?.id,
        name: marketplace?.attributes?.name,
        description: marketplace?.attributes?.description
      },
      sampleUsers: users.slice(0, 3).map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName
      })),
      testResults: {
        userById: userById ? 'Success' : 'Failed',
        listings: listings.length,
        transactions: transactions.length,
        getUserStats: 'See console for details'
      }
    });

  } catch (error) {
    console.error('Error in basic ShareTribe test:', error);
    return NextResponse.json({
      success: false,
      message: 'Basic ShareTribe test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 