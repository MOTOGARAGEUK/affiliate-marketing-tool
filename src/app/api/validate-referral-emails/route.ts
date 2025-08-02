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

    // Get all referrals
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, customer_email, sharetribe_validation_status, sharetribe_validation_updated_at')
      .order('created_at', { ascending: false });

    if (referralsError) {
      return NextResponse.json({ success: false, message: 'Failed to fetch referrals' }, { status: 500 });
    }

    console.log(`🔍 Validating ${referrals.length} referral emails...`);

    const validationResults = [];
    const now = new Date().toISOString();

    for (const referral of referrals) {
      const email = referral.customer_email;
      
      // Check if we have recent validation (within last hour)
      const lastValidation = referral.sharetribe_validation_updated_at;
      const isRecent = lastValidation && (new Date().getTime() - new Date(lastValidation).getTime()) < 3600000; // 1 hour

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

      // Validate email against ShareTribe
      console.log(`🔍 Validating email: ${email}`);
      
      try {
        const sharetribeUser = await sharetribeAPI.getUserByEmail(email);
        
        let status = 'red'; // Default: user not found
        let emailVerified = false;
        let userId = null;
        let displayName = null;

        if (sharetribeUser) {
          userId = sharetribeUser.id;
          displayName = sharetribeUser.profile?.displayName || sharetribeUser.attributes?.profile?.displayName;
          emailVerified = sharetribeUser.attributes?.emailVerified || false;
          
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
          emailVerified: emailVerified
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