import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSharetribeAPI } from '@/lib/sharetribe';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SHARETRIBE REFERRAL SYNC ===');
    
    const body = await request.json();
    const { syncType = 'recent' } = body;
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Initialize Sharetribe API
    const sharetribeAPI = createSharetribeAPI({
      clientId: process.env.SHARETRIBE_CLIENT_ID!,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET!
    });
    
    console.log('Testing Sharetribe API connection...');
    const connectionTest = await sharetribeAPI.testConnection();
    
    if (!connectionTest) {
      console.log('❌ Sharetribe API connection failed');
      return NextResponse.json(
        { success: false, message: 'Sharetribe API connection failed' },
        { status: 500 }
      );
    }
    
    console.log('✅ Sharetribe API connection successful');
    
    // Get recent users from Sharetribe
    const hoursToCheck = syncType === 'all' ? 168 : 24; // 7 days or 1 day
    const users = await sharetribeAPI.getUsers(100, 0);
    
    console.log(`Found ${users.length} users in Sharetribe`);
    
    let matchedCount = 0;
    let newReferralsCount = 0;
    
    for (const user of users) {
      try {
        console.log(`Processing user: ${user.attributes.email}`);
        
        // Check if user was created recently
        const createdAt = new Date(user.createdAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > hoursToCheck) {
          console.log(`User too old (${hoursDiff.toFixed(1)} hours), skipping`);
          continue;
        }
        
        // Check if we already have a referral for this user
        const { data: existingReferral, error: checkError } = await supabase
          .from('referrals')
          .select('id')
          .eq('sharetribe_user_id', user.id)
          .maybeSingle();
        
        if (existingReferral) {
          console.log(`User ${user.attributes.email} already has referral, skipping`);
          continue;
        }
        
        // Look for pending referral clicks that might match this user
        // Check by IP address and recent clicks
        const { data: pendingClicks, error: clicksError } = await supabase
          .from('referral_clicks')
          .select('*')
          .eq('status', 'pending_match')
          .gte('clicked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .order('clicked_at', { ascending: false });
        
        if (clicksError) {
          console.error('Error fetching pending clicks:', clicksError);
          continue;
        }
        
        console.log(`Found ${pendingClicks.length} pending referral clicks`);
        
        // Try to match user with a referral click
        let matched = false;
        
        for (const click of pendingClicks) {
          // Simple matching logic - could be enhanced with more sophisticated algorithms
          // For now, we'll match based on timing and referral code availability
          
          // Check if this click is within a reasonable time window
          const clickTime = new Date(click.clicked_at);
          const userTime = new Date(user.createdAt);
          const timeDiff = Math.abs(userTime.getTime() - clickTime.getTime()) / (1000 * 60); // minutes
          
          if (timeDiff <= 60) { // Within 1 hour
            console.log(`Potential match found: click ${click.id} within ${timeDiff.toFixed(1)} minutes of signup`);
            
            // Call the match endpoint
            const matchResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/match-referral-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userEmail: user.attributes.email,
                userName: user.attributes.profile?.displayName || user.attributes.profile?.firstName || 'Unknown',
                sharetribeUserId: user.id,
                referralCode: click.referral_code
              })
            });
            
            const matchResult = await matchResponse.json();
            
            if (matchResult.success) {
              console.log(`✅ Successfully matched user ${user.attributes.email} with referral click ${click.id}`);
              matched = true;
              matchedCount++;
              newReferralsCount++;
              break;
            } else {
              console.log(`❌ Failed to match user ${user.attributes.email}: ${matchResult.message}`);
            }
          }
        }
        
        if (!matched) {
          console.log(`No match found for user ${user.attributes.email}`);
        }
        
      } catch (error) {
        console.error(`Error processing user ${user.attributes.email}:`, error);
      }
    }
    
    // Clean up expired referral clicks (older than 24 hours)
    const { error: cleanupError } = await supabase
      .from('referral_clicks')
      .update({ status: 'expired' })
      .eq('status', 'pending_match')
      .lt('clicked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (cleanupError) {
      console.error('Error cleaning up expired clicks:', cleanupError);
    } else {
      console.log('✅ Cleaned up expired referral clicks');
    }
    
    console.log(`=== SYNC COMPLETE ===`);
    console.log(`Processed ${users.length} users`);
    console.log(`Matched ${matchedCount} users with referral clicks`);
    console.log(`Created ${newReferralsCount} new referrals`);
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      stats: {
        usersProcessed: users.length,
        usersMatched: matchedCount,
        newReferrals: newReferralsCount
      }
    });
    
  } catch (error) {
    console.error('❌ Sharetribe referral sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Sync failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 