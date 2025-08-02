import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSharetribeCredentials, createSharetribeAPI } from '@/lib/sharetribe';

export async function GET(request: NextRequest) {
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

    // Test with Jacob's user ID (known to work)
    const userId = "688d0c51-8fbc-45e6-8a29-fc66c9ab7990";
    console.log('🔍 Testing with Jacob\'s user ID:', userId);

    // Get user by ID (this works)
    const user = await sharetribeAPI.getUserById(userId);
    console.log('✅ User by ID result:', user ? 'Found' : 'Not found');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found by ID' });
    }

    console.log('✅ User details:', {
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName
    });

    // Test getUserByEmail with Jacob's email
    console.log('🔍 Testing getUserByEmail with:', user.email);
    const userByEmail = await sharetribeAPI.getUserByEmail(user.email);
    console.log('✅ User by email result:', userByEmail ? 'Found' : 'Not found');

    if (userByEmail) {
      console.log('✅ User by email details:', {
        id: userByEmail.id,
        email: userByEmail.email,
        displayName: userByEmail.profile?.displayName
      });
    } else {
      console.log('❌ getUserByEmail failed to find user with email:', user.email);
    }

    // Get listings and transactions
    const listings = await sharetribeAPI.getUserListings(userId);
    const transactions = await sharetribeAPI.getUserTransactions(userId);

    // Let's also test the raw users query to see what's happening
    console.log('🔍 Testing raw users query...');
    const allUsers = await sharetribeAPI.getUsers(1000);
    
    const userEmails = allUsers.map((u: any) => u.email);
    const jacobEmailIndex = userEmails.findIndex((email: string) => 
      email.toLowerCase() === user.email.toLowerCase()
    );

    return NextResponse.json({
      success: true,
      message: 'Simple test completed successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName
      },
      emailLookup: {
        email: user.email,
        found: !!userByEmail,
        userByEmail: userByEmail ? {
          id: userByEmail.id,
          email: userByEmail.email,
          displayName: userByEmail.profile?.displayName
        } : null
      },
      debug: {
        totalUsersInShareTribe: allUsers.length,
        allUserEmails: userEmails,
        jacobEmailFound: jacobEmailIndex !== -1,
        jacobEmailIndex: jacobEmailIndex,
        jacobEmailInList: jacobEmailIndex !== -1 ? userEmails[jacobEmailIndex] : null
      },
      listings: listings.length,
      transactions: transactions.length
    });

  } catch (error) {
    console.error('Error in simple test:', error);
    return NextResponse.json({
      success: false,
      message: 'Simple test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 