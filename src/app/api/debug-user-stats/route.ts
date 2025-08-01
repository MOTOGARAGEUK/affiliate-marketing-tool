import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId' },
        { status: 400 }
      );
    }

    console.log('🔍 Debugging getUserStats for user:', userId);

    // Get the authorization header to get the actual user
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
    
    const { data: { user: authUser }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get ShareTribe credentials from the authenticated user
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(authUser.id);

    if (!credentials) {
      return NextResponse.json({
        success: false,
        message: 'ShareTribe credentials not found for authenticated user'
      }, { status: 404 });
    }

    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI(credentials);

    // Step 1: Get user details
    console.log('Step 1: Getting user details...');
    const sharetribeUser = await sharetribeAPI.getUserById(userId);
    if (!sharetribeUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        step: 'getUserById'
      }, { status: 404 });
    }
    console.log('✅ User found:', sharetribeUser.id, sharetribeUser.email);

    // Step 2: Test listings query
    console.log('Step 2: Testing listings query...');
    try {
      const listings = await sharetribeAPI.getUserListings(userId, 1000);
      console.log('✅ Listings query successful, found:', listings.length);
      
    } catch (listingsError) {
      console.error('❌ Listings query failed:', listingsError);
      return NextResponse.json({
        success: false,
        message: 'Listings query failed',
        step: 'listings',
        error: listingsError instanceof Error ? listingsError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 3: Test transactions query
    console.log('Step 3: Testing transactions query...');
    try {
      const transactions = await sharetribeAPI.getUserTransactions(userId, 1000);
      console.log('✅ Transactions query successful, found:', transactions.length);
      
    } catch (transactionsError) {
      console.error('❌ Transactions query failed:', transactionsError);
      return NextResponse.json({
        success: false,
        message: 'Transactions query failed',
        step: 'transactions',
        error: transactionsError instanceof Error ? transactionsError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 4: Test full getUserStats
    console.log('Step 4: Testing full getUserStats...');
    try {
      console.log('Step 4a: About to call getUserStats with userId:', userId);
      const stats = await sharetribeAPI.getUserStats(userId);
      
      console.log('Step 4b: getUserStats returned:', stats);
      
      if (!stats) {
        console.log('❌ getUserStats returned null');
        return NextResponse.json({
          success: false,
          message: 'getUserStats returned null',
          step: 'getUserStats',
          details: 'The method returned null, check the console logs for detailed error information'
        }, { status: 500 });
      }

      console.log('✅ getUserStats successful:', stats);

      return NextResponse.json({
        success: true,
        message: 'User stats debug completed successfully',
        user: {
          id: sharetribeUser.id,
          email: sharetribeUser.email,
          displayName: sharetribeUser.profile?.displayName
        },
        stats: stats
      });

    } catch (getUserStatsError) {
      console.error('❌ getUserStats error:', getUserStatsError);
      console.error('❌ getUserStats error stack:', getUserStatsError instanceof Error ? getUserStatsError.stack : 'No stack');
      return NextResponse.json({
        success: false,
        message: 'getUserStats threw an error',
        step: 'getUserStats',
        error: getUserStatsError instanceof Error ? getUserStatsError.message : 'Unknown error',
        stack: getUserStatsError instanceof Error ? getUserStatsError.stack : undefined
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in user stats debug:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error in user stats debug',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 