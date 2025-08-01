import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email parameter required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId parameter required' },
        { status: 400 }
      );
    }

    console.log('Testing ShareTribe connection for email:', email, 'user:', userId);

    // Get ShareTribe credentials from database
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(userId);

    if (!credentials) {
      console.error('No ShareTribe credentials found for user:', userId);
      return NextResponse.json(
        { success: false, message: 'ShareTribe integration not configured for this user' },
        { status: 400 }
      );
    }

    console.log('✅ Found ShareTribe credentials for user:', userId);

    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI(credentials);

    // Test 1: Check API connection
    console.log('Testing API connection...');
    const connectionTest = await sharetribeAPI.testConnection();
    console.log('Connection test result:', connectionTest);

    // Test 2: Get user by email
    console.log('Looking up user by email:', email);
    const user = await sharetribeAPI.getUserByEmail(email);
    console.log('User lookup result:', user);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found in ShareTribe',
        connectionTest,
        email
      });
    }

    // Test 3: Get user stats
    console.log('Getting user stats for user ID:', user.id);
    const stats = await sharetribeAPI.getUserStats(user.id);
    console.log('User stats result:', stats);

    // Test 4: Get user listings directly
    console.log('Getting user listings for user ID:', user.id);
    const listings = await sharetribeAPI.getUserListings(user.id, 50);
    console.log('User listings result:', listings);

    // Test 5: Get user transactions directly
    console.log('Getting user transactions for user ID:', user.id);
    const transactions = await sharetribeAPI.getUserTransactions(user.id, 50);
    console.log('User transactions result:', transactions);

    return NextResponse.json({
      success: true,
      connectionTest,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        profile: user.profile
      },
      stats,
      listings: {
        count: listings.length,
        items: listings.slice(0, 5) // Show first 5 listings
      },
      transactions: {
        count: transactions.length,
        items: transactions.slice(0, 5) // Show first 5 transactions
      }
    });

  } catch (error) {
    console.error('ShareTribe connection test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'ShareTribe connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 