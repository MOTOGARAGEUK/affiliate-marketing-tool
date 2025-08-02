import { NextRequest, NextResponse } from 'next/server';
import { createSharetribeAPI, getSharetribeCredentials } from '@/lib/sharetribe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    // Get ShareTribe credentials
    const credentials = await getSharetribeCredentials(user.id);
    if (!credentials) {
      return NextResponse.json({ success: false, message: 'No ShareTribe integration found' }, { status: 404 });
    }

    // Create ShareTribe API instance
    const sharetribeAPI = createSharetribeAPI(credentials);

    console.log('🔍 Testing ShareTribe users query...');

    // Test the raw users query
    const rawResponse = await sharetribeAPI.testRawUsersAPI();
    console.log('📊 Raw users query response:', rawResponse);

    // Test getting all users
    const allUsers = await sharetribeAPI.getUsers(1000);
    console.log('👥 All users found:', allUsers.length);

    // Test getting users with different parameters
    const sdk = await sharetribeAPI.getSDK();
    
    // Test 1: Basic query
    console.log('🧪 Test 1: Basic users query');
    try {
      const basicQuery = await sdk.users.query({ perPage: 10 });
      console.log('✅ Basic query success:', {
        totalItems: basicQuery.data?.meta?.totalItems,
        dataLength: basicQuery.data?.data?.length
      });
    } catch (error) {
      console.log('❌ Basic query failed:', error);
    }

    // Test 2: Query with different parameters
    console.log('🧪 Test 2: Users query with different parameters');
    try {
      const paramQuery = await sdk.users.query({ 
        perPage: 50,
        page: 1
      });
      console.log('✅ Parameter query success:', {
        totalItems: paramQuery.data?.meta?.totalItems,
        dataLength: paramQuery.data?.data?.length
      });
    } catch (error) {
      console.log('❌ Parameter query failed:', error);
    }

    // Test 3: Query with state filter
    console.log('🧪 Test 3: Users query with state filter');
    try {
      const stateQuery = await sdk.users.query({ 
        perPage: 50,
        state: 'active'
      });
      console.log('✅ State query success:', {
        totalItems: stateQuery.data?.meta?.totalItems,
        dataLength: stateQuery.data?.data?.length
      });
    } catch (error) {
      console.log('❌ State query failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Users query test completed',
      results: {
        rawResponse,
        allUsersCount: allUsers.length,
        allUsers: allUsers.map(u => ({ id: u.id, email: u.email, displayName: u.profile?.displayName }))
      }
    });

  } catch (error) {
    console.error('❌ Error in users query test:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Users query test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 