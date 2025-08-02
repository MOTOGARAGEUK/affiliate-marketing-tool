import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSharetribeAPI } from '@/lib/sharetribe';

export async function POST(request: NextRequest) {
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

    // Get ShareTribe settings
    const { data: sharetribeSettings, error: settingsError } = await authenticatedSupabase
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', user.id)
      .eq('setting_type', 'sharetribe');

    if (settingsError || !sharetribeSettings || sharetribeSettings.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ShareTribe settings not found. Please configure ShareTribe integration first.' },
        { status: 400 }
      );
    }

    // Build ShareTribe config
    const config: any = {};
    sharetribeSettings.forEach(setting => {
      config[setting.setting_key] = setting.setting_value;
    });

    // Create ShareTribe API instance
    const sharetribeAPI = createSharetribeAPI(config);

    // Get referrals that don't have validation status
    const { data: referrals, error: referralsError } = await authenticatedSupabase
      .from('referrals')
      .select('id, customer_email, sharetribe_validation_status')
      .eq('user_id', user.id)
      .or('sharetribe_validation_status.is.null,sharetribe_validation_status.eq.amber');

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    if (!referrals || referrals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No referrals found that need validation',
        validated: 0,
        total: 0
      });
    }

    let validated = 0;
    let errors = 0;

    // Validate each referral
    for (const referral of referrals) {
      try {
        console.log(`Validating email: ${referral.customer_email}`);
        
        const user = await sharetribeAPI.getUserByEmail(referral.customer_email);
        
        let validationStatus: 'green' | 'amber' | 'red' | 'error';
        
        if (user) {
          // Check if user has verified email
          if (user.attributes.emailVerified) {
            validationStatus = 'green';
          } else {
            validationStatus = 'amber';
          }
        } else {
          validationStatus = 'red';
        }

        // Update referral with validation status
        const { error: updateError } = await authenticatedSupabase
          .from('referrals')
          .update({
            sharetribe_validation_status: validationStatus,
            sharetribe_validation_updated_at: new Date().toISOString()
          })
          .eq('id', referral.id);

        if (updateError) {
          console.error(`Error updating referral ${referral.id}:`, updateError);
          errors++;
        } else {
          validated++;
          console.log(`✅ Validated ${referral.customer_email}: ${validationStatus}`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error validating ${referral.customer_email}:`, error);
        
        // Update with error status
        await authenticatedSupabase
          .from('referrals')
          .update({
            sharetribe_validation_status: 'error',
            sharetribe_validation_updated_at: new Date().toISOString()
          })
          .eq('id', referral.id);
        
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Validation completed. ${validated} referrals validated, ${errors} errors.`,
      validated,
      errors,
      total: referrals.length
    });

  } catch (error) {
    console.error('Failed to validate referrals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to validate referrals' },
      { status: 500 }
    );
  }
} 