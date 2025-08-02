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

    // Get request body to check for force refresh
    const body = await request.json().catch(() => ({}));
    const forceRefresh = body.forceRefresh || false;

    // Get ShareTribe credentials
    const credentials = await getSharetribeCredentials(user.id);
    if (!credentials) {
      return NextResponse.json({ success: false, message: 'No ShareTribe integration found' }, { status: 404 });
    }

    // Create ShareTribe API instance
    const sharetribeAPI = createSharetribeAPI(credentials);

    // Get all referrals for this user
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, customer_email, sharetribe_validation_status, sharetribe_validation_updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      return NextResponse.json({ success: false, message: 'Failed to fetch referrals' }, { status: 500 });
    }

    console.log(`🔍 Validating ${referrals.length} referral emails...`);
    if (forceRefresh) {
      console.log('🔄 Force refresh enabled - clearing cache');
    }

    const validationResults = [];
    const now = new Date().toISOString();

    for (const referral of referrals) {
      const email = referral.customer_email;
      
      // Check if we have recent validation (within last hour) - unless force refresh
      const lastValidation = referral.sharetribe_validation_updated_at;
      const isRecent = !forceRefresh && lastValidation && (new Date().getTime() - new Date(lastValidation).getTime()) < 3600000; // 1 hour

      if (isRecent && referral.sharetribe_validation_status) {
        // Use cached result
        validationResults.push({
          referralId: referral.id,
          email: email,
          status: referral.sharetribe_validation_status,
          cached: true,
          lastChecked: lastValidation
        });
        console.log(`✅ Using cached validation for ${email}: ${referral.sharetribe_validation_status}`);
        continue;
      }

      // Validate email against ShareTribe using the current user's credentials
      console.log(`🔍 Validating email: ${email}`);
      
      try {
        // Get ShareTribe settings for the current user
        const { data: settings, error: settingsError } = await supabase
          .from('settings')
          .select('setting_key, setting_value')
          .eq('user_id', user.id)
          .eq('setting_type', 'sharetribe');

        if (settingsError || !settings || settings.length === 0) {
          console.log(`⚠️ No ShareTribe settings found for user ${user.id}`);
          validationResults.push({
            referralId: referral.id,
            email: email,
            status: 'error',
            cached: false,
            lastChecked: now,
            error: 'No ShareTribe settings found'
          });
          continue;
        }

        // Convert to object (same as debug test)
        const settingsObj: any = {};
        settings.forEach(setting => {
          settingsObj[setting.setting_key] = setting.setting_value;
        });

        // Use Integration API credentials
        if (!settingsObj.integrationClientId || !settingsObj.integrationClientSecret) {
          console.log(`⚠️ No Integration API credentials found for user ${user.id}`);
          validationResults.push({
            referralId: referral.id,
            email: email,
            status: 'error',
            cached: false,
            lastChecked: now,
            error: 'No Integration API credentials found'
          });
          continue;
        }

        // Import SDK (same as debug test)
        let sharetribeIntegrationSdk;
        try {
          const module = await import('sharetribe-flex-integration-sdk');
          sharetribeIntegrationSdk = module.default || module;
        } catch (importError) {
          console.error(`❌ SDK import failed for user ${user.id}:`, importError);
          validationResults.push({
            referralId: referral.id,
            email: email,
            status: 'error',
            cached: false,
            lastChecked: now,
            error: 'SDK import failed'
          });
          continue;
        }

        const integrationSdk = sharetribeIntegrationSdk.createInstance({
          clientId: settingsObj.integrationClientId,
          clientSecret: settingsObj.integrationClientSecret
        });

        // Get all users from ShareTribe
        console.log(`🔍 Fetching all users from ShareTribe for user ${user.id}...`);
        const usersResponse = await integrationSdk.users.query({
          limit: 1000
        });

        if (!usersResponse || !usersResponse.data || !usersResponse.data.data) {
          console.log(`⚠️ No users found or invalid response for user ${user.id}`);
          validationResults.push({
            referralId: referral.id,
            email: email,
            status: 'error',
            cached: false,
            lastChecked: now,
            error: 'No users found in ShareTribe'
          });
          continue;
        }

        const sharetribeUsers = usersResponse.data.data;
        console.log(`✅ Found ${sharetribeUsers.length} users in ShareTribe for user ${user.id}`);

        // Find user by email (same logic as debug test)
        const sharetribeUser = sharetribeUsers.find((user: any) => 
          user.attributes?.email?.toLowerCase() === email.toLowerCase()
        );
        
        // Log the complete ShareTribe user object in the expected format
        if (sharetribeUser) {
          const userResponse = {
            data: [{
              id: sharetribeUser.id,
              type: "user",
              attributes: sharetribeUser.attributes
            }],
            meta: {
              totalItems: 1,
              totalPages: 1,
              page: 1,
              perPage: 1
            }
          };
          
          console.log(`// res.data for ${email}:`);
          console.log(JSON.stringify(userResponse, null, 2));
        } else {
          console.log(`// No user found for ${email}`);
          console.log('null');
        }
        
        let status = 'red'; // Default: user not found
        let emailVerified = false;
        let userId = null;
        let displayName = null;

        if (sharetribeUser) {
          userId = sharetribeUser.id;
          displayName = sharetribeUser.attributes?.profile?.displayName;
          
          // Get emailVerified from the ShareTribe user attributes (same as debug test)
          emailVerified = sharetribeUser.attributes?.emailVerified === true;
          
          console.log(`🔍 User validation details for ${email}:`, {
            userId: userId,
            displayName: displayName,
            emailVerified: emailVerified,
            attributes: sharetribeUser.attributes
          });
          
          if (emailVerified) {
            status = 'green'; // User exists and email verified
          } else {
            status = 'amber'; // User exists but email not verified
          }
        }

        // Update database with validation result
        const { error: updateError } = await supabase
          .from('referrals')
          .update({
            sharetribe_validation_status: status,
            sharetribe_validation_updated_at: now,
            sharetribe_user_id: userId ? JSON.stringify(userId) : null
          })
          .eq('id', referral.id);

        if (updateError) {
          console.error(`❌ Failed to update validation status for ${email}:`, updateError);
        }

        validationResults.push({
          referralId: referral.id,
          email: email,
          status: status,
          cached: false,
          lastChecked: now,
          userId: userId,
          displayName: displayName,
          emailVerified: emailVerified,
          sharetribeUserAttributes: sharetribeUser ? sharetribeUser.attributes : null
        });

        console.log(`✅ Validation result for ${email}: ${status} (verified: ${emailVerified})`);

        // Rate limiting: wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error validating ${email}:`, error);
        validationResults.push({
          referralId: referral.id,
          email: email,
          status: 'error',
          cached: false,
          lastChecked: now,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Calculate summary
    const summary = {
      total: validationResults.length,
      green: validationResults.filter(r => r.status === 'green').length,
      amber: validationResults.filter(r => r.status === 'amber').length,
      red: validationResults.filter(r => r.status === 'red').length,
      error: validationResults.filter(r => r.status === 'error').length,
      cached: validationResults.filter(r => r.cached).length,
      fresh: validationResults.filter(r => !r.cached).length
    };

    console.log('📊 Validation Summary:', summary);
    
    // Log all user responses in the expected format
    console.log('\n=== ALL SHARETRIBE USER RESPONSES ===');
    const allUserResponses = validationResults
      .filter(r => r.userId) // Only include found users
      .map(r => ({
        email: r.email,
        user: {
          id: r.userId,
          type: "user",
          attributes: r.sharetribeUserAttributes || {}
        }
      }));
    
    console.log('// All found users:');
    console.log(JSON.stringify(allUserResponses, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Email validation completed',
      summary: summary,
      results: validationResults
    });

  } catch (error) {
    console.error('❌ Error in email validation:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Email validation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 