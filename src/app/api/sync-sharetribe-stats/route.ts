import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralId, userEmail } = body;

    if (!referralId || !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Missing referralId or userEmail' },
        { status: 400 }
      );
    }

    console.log('🔄 Syncing ShareTribe stats for referral:', referralId, 'user:', userEmail);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the user ID from the referral
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('user_id')
      .eq('id', referralId)
      .single();

    if (referralError || !referral) {
      console.error('Error fetching referral:', referralError);
      return NextResponse.json(
        { success: false, message: 'Referral not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found referral for user:', referral.user_id);

    // For now, just return success without ShareTribe integration
    // This will help us test if the basic endpoint works
    return NextResponse.json({
      success: true,
      message: 'Basic sync endpoint working',
      referralId,
      userEmail,
      userId: referral.user_id
    });

  } catch (error) {
    console.error('❌ Error in sync endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error in sync endpoint',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 