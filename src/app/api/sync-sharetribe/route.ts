import { NextRequest, NextResponse } from 'next/server';
import { createSharetribeAPI, extractReferralCode, isRecentSignup } from '@/lib/sharetribe';
import { mockAffiliates, mockReferrals } from '@/lib/mockData';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret, hours = 24 } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // Create Sharetribe API instance
    const sharetribeAPI = createSharetribeAPI({
      clientId,
      clientSecret,
    });

    // Get recent users from Sharetribe
    const users = await sharetribeAPI.getUsers(100, 0);
    
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found in the specified time range.',
        newReferrals: 0,
        processedUsers: 0,
      });
    }

    let newReferrals = 0;
    let processedUsers = 0;

    // Process each user to check for affiliate referrals
    for (const user of users) {
      // Only process recent signups
      if (!isRecentSignup(user, hours)) {
        continue;
      }

      processedUsers++;

      // Extract referral code from user attributes
      const referralCode = extractReferralCode(user);
      
      if (referralCode) {
        // Find affiliate by referral code
        const affiliate = mockAffiliates.find(a => a.referralCode === referralCode);
        
        if (affiliate) {
          // Create referral record
          const referral = {
            id: generateId(),
            affiliateId: affiliate.id,
            programId: affiliate.programId || '1', // Default to signup program
            customerEmail: user.attributes.email,
            customerName: user.attributes.profile?.displayName || user.attributes.profile?.firstName,
            commission: 0, // Will be calculated based on program
            status: 'pending',
            type: 'signup' as const,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(),
          };

          // In a real app, you would save this to a database
          console.log('New affiliate referral tracked:', referral);
          newReferrals++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processedUsers} users and found ${newReferrals} new affiliate referrals.`,
      newReferrals,
      processedUsers,
      totalUsers: users.length,
    });

  } catch (error) {
    console.error('Sharetribe sync error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync with Sharetribe. Please check your API credentials and try again.' 
      },
      { status: 500 }
    );
  }
}

// Manual sync endpoint (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const clientSecret = searchParams.get('clientSecret');
    const hours = parseInt(searchParams.get('hours') || '24');

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // Create Sharetribe API instance
    const sharetribeAPI = createSharetribeAPI({
      clientId,
      clientSecret,
    });

    // Get recent users
    const users = await sharetribeAPI.getUsers(50, 0);
    
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found.',
        users: [],
      });
    }

    // Filter recent users and extract referral codes
    const recentUsers = users.filter(user => isRecentSignup(user, hours));
    const usersWithReferrals = recentUsers.map(user => ({
      id: user.id,
      email: user.attributes.email,
      name: user.attributes.profile?.displayName || user.attributes.profile?.firstName,
      createdAt: user.createdAt,
      referralCode: extractReferralCode(user),
    }));

    return NextResponse.json({
      success: true,
      message: `Found ${recentUsers.length} recent users out of ${users.length} total users.`,
      users: usersWithReferrals,
      totalUsers: users.length,
      recentUsers: recentUsers.length,
    });

  } catch (error) {
    console.error('Sharetribe sync error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync with Sharetribe.' 
      },
      { status: 500 }
    );
  }
} 