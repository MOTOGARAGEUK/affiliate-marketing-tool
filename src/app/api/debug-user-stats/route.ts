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
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get ShareTribe credentials from the authenticated user
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(user.id);

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
    const user = await sharetribeAPI.getUserById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        step: 'getUserById'
      }, { status: 404 });
    }
    console.log('✅ User found:', user.id, user.email);

    // Step 2: Test listings query
    console.log('Step 2: Testing listings query...');
    try {
      const sdk = await sharetribeAPI['getSDK']();
      const listingsResponse = await sdk.listings.query({ 
        user_id: userId,
        perPage: 1000
      });
      
      console.log('Listings API response:', {
        totalItems: listingsResponse.data?.meta?.totalItems,
        currentPage: listingsResponse.data?.meta?.page,
        perPage: listingsResponse.data?.meta?.perPage,
        dataLength: listingsResponse.data?.data?.length
      });
      
      const listings = listingsResponse.data?.data || [];
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
      const sdk = await sharetribeAPI['getSDK']();
      const transactionsResponse = await sdk.transactions.query({ 
        user_id: userId,
        perPage: 1000
      });
      
      console.log('Transactions API response:', {
        totalItems: transactionsResponse.data?.meta?.totalItems,
        currentPage: transactionsResponse.data?.meta?.page,
        perPage: transactionsResponse.data?.meta?.perPage,
        dataLength: transactionsResponse.data?.data?.length
      });
      
      const transactions = transactionsResponse.data?.data || [];
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
    const stats = await sharetribeAPI.getUserStats(userId);
    
    if (!stats) {
      return NextResponse.json({
        success: false,
        message: 'getUserStats returned null',
        step: 'getUserStats'
      }, { status: 500 });
    }

    console.log('✅ getUserStats successful:', stats);

    return NextResponse.json({
      success: true,
      message: 'User stats debug completed successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName
      },
      stats: stats
    });

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