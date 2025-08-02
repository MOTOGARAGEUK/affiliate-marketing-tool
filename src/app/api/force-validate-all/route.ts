import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🔄 Force validating all referrals for user:', userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get ShareTribe settings
    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', userId)
      .eq('setting_type', 'sharetribe');

    if (error || !settings || settings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No ShareTribe settings found' 
      });
    }

    // Convert to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    // Use Integration API credentials
    if (!settingsObj.integrationClientId || !settingsObj.integrationClientSecret) {
      return NextResponse.json({ 
        success: false, 
        message: 'Integration API credentials required' 
      });
    }

    // Import SDK
    let sharetribeIntegrationSdk;
    try {
      const module = await import('sharetribe-flex-integration-sdk');
      sharetribeIntegrationSdk = module.default || module;
    } catch (importError) {
      return NextResponse.json({ 
        success: false, 
        message: 'SDK import failed',
        error: importError instanceof Error ? importError.message : 'Unknown error'
      });
    }

    const integrationSdk = sharetribeIntegrationSdk.createInstance({
      clientId: settingsObj.integrationClientId,
      clientSecret: settingsObj.integrationClientSecret
    });

    // Get all users from ShareTribe
    console.log('🔍 Fetching all users from ShareTribe...');
    const usersResponse = await integrationSdk.users.query({
      limit: 1000
    });

    if (!usersResponse || !usersResponse.data || !usersResponse.data.data) {
      return NextResponse.json({ 
        success: false, 
        message: 'No users found or invalid response' 
      });
    }

    const sharetribeUsers = usersResponse.data.data;
    console.log(`✅ Found ${sharetribeUsers.length} users in ShareTribe`);

    // Create a map of email -> user data for quick lookup
    const emailToUserMap = new Map();
    sharetribeUsers.forEach((user: any) => {
      const email = user.attributes?.email?.toLowerCase();
      if (email) {
        emailToUserMap.set(email, {
          id: user.id,
          email: user.attributes.email,
          emailVerified: user.attributes.emailVerified === true,
          createdAt: user.attributes.createdAt,
          displayName: user.attributes.profile?.displayName
        });
      }
    });

    console.log(`✅ Created email map with ${emailToUserMap.size} users`);

    // Get all referrals for this user
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('affiliate_id', userId);

    if (referralsError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch referrals',
        error: referralsError
      });
    }

    console.log(`🔍 Found ${referrals?.length || 0} referrals to validate`);

    const now = new Date().toISOString();
    const results = {
      total: referrals?.length || 0,
      updated: 0,
      errors: 0,
      details: [] as any[]
    };

    // Validate each referral
    for (const referral of referrals || []) {
      try {
        const email = referral.customer_email?.toLowerCase();
        const sharetribeUser = emailToUserMap.get(email);
        
        let status = 'red'; // Default: user not found
        let emailVerified = false;
        let userId = null;
        let createdAt = null;

        if (sharetribeUser) {
          userId = sharetribeUser.id;
          emailVerified = sharetribeUser.emailVerified;
          createdAt = sharetribeUser.createdAt;
          
          if (emailVerified) {
            status = 'green'; // User exists and email verified
          } else {
            status = 'amber'; // User exists but email not verified
          }
        }

        // Update database
        const { error: updateError } = await supabase
          .from('referrals')
          .update({
            sharetribe_validation_status: status,
            sharetribe_validation_updated_at: now,
            sharetribe_user_id: userId ? JSON.stringify(userId) : null,
            sharetribe_created_at: createdAt
          })
          .eq('id', referral.id);

        if (updateError) {
          console.error(`❌ Failed to update referral ${referral.id}:`, updateError);
          results.errors++;
          results.details.push({
            referralId: referral.id,
            email: email,
            error: updateError.message
          });
        } else {
          results.updated++;
          results.details.push({
            referralId: referral.id,
            email: email,
            status: status,
            emailVerified: emailVerified,
            userId: userId
          });
        }

      } catch (error) {
        console.error(`❌ Error validating referral ${referral.id}:`, error);
        results.errors++;
        results.details.push({
          referralId: referral.id,
          email: referral.customer_email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Force validation completed: ${results.updated} updated, ${results.errors} errors`);

    return NextResponse.json({ 
      success: true, 
      message: 'Force validation completed',
      results: results
    });

  } catch (error) {
    console.error('❌ Force validation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Force validation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
} 