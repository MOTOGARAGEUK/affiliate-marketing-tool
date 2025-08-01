import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    console.log('🧪 Testing referral creation for user:', user.id);

    // Get the first affiliate for this user
    const { data: affiliates, error: affiliatesError } = await authenticatedSupabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (affiliatesError || !affiliates || affiliates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No affiliates found' },
        { status: 404 }
      );
    }

    const affiliate = affiliates[0];
    console.log('✅ Found affiliate:', affiliate.name, 'with referral code:', affiliate.referral_code);

    // Test creating a referral using the same logic as the tracking script
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Test User';

    // Check if this customer has already been tracked for this affiliate
    const { data: existingReferral, error: checkError } = await authenticatedSupabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('customer_email', testEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing referral:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking referral' },
        { status: 500 }
      );
    }

    if (existingReferral) {
      return NextResponse.json(
        { success: false, message: 'Test referral already exists' },
        { status: 409 }
      );
    }

    // Create the referral record
    const { data: referral, error: referralError } = await authenticatedSupabase
      .from('referrals')
      .insert({
        user_id: affiliate.user_id,
        affiliate_id: affiliate.id,
        program_id: affiliate.program_id,
        customer_email: testEmail,
        customer_name: testName,
        status: 'approved',
        commission: 10, // Test commission
        referral_code: affiliate.referral_code
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating test referral:', referralError);
      console.error('Error details:', {
        code: referralError.code,
        message: referralError.message,
        details: referralError.details,
        hint: referralError.hint
      });
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error creating test referral', 
          error: {
            code: referralError.code,
            message: referralError.message,
            details: referralError.details,
            hint: referralError.hint
          }
        },
        { status: 500 }
      );
    }

    console.log('✅ Test referral created successfully:', referral.id);

    // Update affiliate stats
    try {
      await authenticatedSupabase
        .from('affiliates')
        .update({
          total_referrals: (affiliate.total_referrals || 0) + 1,
          total_earnings: (affiliate.total_earnings || 0) + 10
        })
        .eq('id', affiliate.id);
      console.log('✅ Affiliate stats updated');
    } catch (updateError) {
      console.error('Error updating affiliate stats:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Test referral created successfully',
      referral: {
        id: referral.id,
        affiliate_name: affiliate.name,
        customer_name: testName,
        customer_email: testEmail,
        commission: 10,
        status: 'approved'
      }
    });

  } catch (error) {
    console.error('Failed to create test referral:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create test referral' },
      { status: 500 }
    );
  }
} 