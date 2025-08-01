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

    console.log('Testing simple ShareTribe operations for user:', user.id);

    // Get ShareTribe credentials
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(user.id);

    if (!credentials) {
      return NextResponse.json({
        success: false,
        message: 'ShareTribe credentials not found'
      }, { status: 404 });
    }

    console.log('ShareTribe credentials found');

    // Test basic connection
    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI(credentials);

    console.log('Testing ShareTribe connection...');
    const connectionTest = await sharetribeAPI.testConnection();
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        message: 'ShareTribe connection failed'
      }, { status: 500 });
    }

    console.log('ShareTribe connection successful');

    // Test getting a specific user
    const testUserId = "688d0c51-8fbc-45e6-8a29-fc66c9ab7990"; // Jacob M's ID
    console.log('Testing getUserById with:', testUserId);
    
    const testUser = await sharetribeAPI.getUserById(testUserId);
    if (!testUser) {
      return NextResponse.json({
        success: false,
        message: 'Could not get user by ID'
      }, { status: 500 });
    }

    console.log('User found:', testUser.email);

    // Test getting user listings
    console.log('Testing getUserListings...');
    const listings = await sharetribeAPI.getUserListings(testUserId, 10);
    console.log('Listings found:', listings.length);

    // Test getting user transactions
    console.log('Testing getUserTransactions...');
    const transactions = await sharetribeAPI.getUserTransactions(testUserId, 10);
    console.log('Transactions found:', transactions.length);

    return NextResponse.json({
      success: true,
      message: 'Simple test completed successfully',
      user: {
        id: testUser.id,
        email: testUser.email,
        displayName: testUser.profile?.displayName
      },
      listings: listings.length,
      transactions: transactions.length
    });

  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 