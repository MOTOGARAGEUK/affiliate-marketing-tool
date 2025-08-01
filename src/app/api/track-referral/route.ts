import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== REFERRAL TRACKING DEBUG ===');
    console.log('Request received at:', new Date().toISOString());
    
    const body = await request.json();
    console.log('Request body:', body);
    
    let { 
      action, // 'page_view', 'form_submit', 'signup_click', 'signup_complete'
      referralCode, 
      email,
      userInfo,
      page,
      timestamp
    } = body;

    // Handle different tracking actions
    if (action === 'page_view') {
      console.log('📄 Page view tracked:', { referralCode, page });
      return NextResponse.json({ success: true, message: 'Page view tracked' });
    }
    
    if (action === 'signup_click') {
      console.log('🖱️ Signup click tracked:', { referralCode });
      return NextResponse.json({ success: true, message: 'Signup click tracked' });
    }
    
    if (action === 'form_submit') {
      console.log('📝 Form submission tracked:', { referralCode, email });
      return NextResponse.json({ success: true, message: 'Form submission tracked' });
    }
    
    // Handle signup completion
    if (action === 'signup_complete') {
      console.log('✅ Signup completion tracked:', { referralCode, userInfo });
      
      const customerEmail = userInfo?.email || email;
      const customerName = userInfo?.name || 'Unknown User';
      
      if (!customerEmail) {
        console.log('❌ No email provided for signup completion');
        return NextResponse.json(
          { success: false, message: 'No email provided' },
          { status: 400 }
        );
      }
      
      // Process the signup completion
      const result = await processSignupCompletion(referralCode, customerEmail, customerName);
      
      // Also try to update Sharetribe user metadata
      if (result.success) {
        try {
          await updateSharetribeUserMetadata(customerEmail, referralCode);
        } catch (metadataError) {
          console.error('❌ Error updating Sharetribe metadata:', metadataError);
          // Don't fail the whole request if metadata update fails
        }
      }
      
      return result;
    }

    // Legacy support for old format
    let { 
      customerEmail, 
      customerName, 
      amount = 0,
      listingsCount = 0
    } = body;

    // If no referral code provided in body, try to get it from cookies
    if (!referralCode) {
      console.log('No referral code in body, checking cookies...');
      const cookieHeader = request.headers.get('cookie');
      console.log('Cookie header:', cookieHeader);
      
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);

        referralCode = cookies.referralCode;
        console.log('Found referral code in cookies:', referralCode);
      } else {
        console.log('No cookie header found');
      }
    } else {
      console.log('Referral code provided in body:', referralCode);
    }

    if (!customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!referralCode) {
      return NextResponse.json(
        { success: false, message: 'No referral code provided' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find the affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select(`
        id,
        user_id,
        affiliate_name,
        referral_code,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('referral_code', referralCode)
      .single();

    if (affiliateError || !affiliate) {
      console.log('❌ Referral code not found in database:', referralCode);
      console.log('Affiliate error:', affiliateError);
      console.log('=== END REFERRAL TRACKING DEBUG ===');
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 404 }
      );
    }

    console.log('✅ Found affiliate:', affiliate.affiliate_name);

    // Check if this customer has already been tracked for this affiliate
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('customer_email', customerEmail.toLowerCase().trim())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing referral:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking referral' },
        { status: 500 }
      );
    }

    if (existingReferral) {
      console.log('Customer already tracked for this affiliate');
      return NextResponse.json(
        { success: false, message: 'Customer already tracked' },
        { status: 409 }
      );
    }

    // Calculate commission based on program type
    const program = affiliate.programs;
    let commissionEarned = 0;
    let status = 'pending';

    if (action === 'signup' && program.type === 'signup') {
      if (program.commission_type === 'percentage') {
        commissionEarned = (amount * program.commission) / 100;
      } else {
        commissionEarned = program.commission;
      }
      status = 'approved'; // Signups are typically auto-approved
    } else if (action === 'purchase' && program.type === 'purchase') {
      if (program.commission_type === 'percentage') {
        commissionEarned = (amount * program.commission) / 100;
      } else {
        commissionEarned = program.commission;
      }
      status = 'pending'; // Purchases may need manual approval
    }

    // Create the referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        user_id: affiliate.user_id,
        affiliate_id: affiliate.id,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_name: customerName,
        signup_date: new Date().toISOString(),
        listings_count: action === 'signup' ? listingsCount : 0,
        purchases_count: action === 'purchase' ? 1 : 0,
        total_revenue: action === 'purchase' ? amount : 0,
        status: status,
        commission_earned: commissionEarned
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating referral:', referralError);
      return NextResponse.json(
        { success: false, message: 'Error creating referral' },
        { status: 500 }
      );
    }

    console.log('✅ Referral tracked successfully:', {
      affiliate: affiliate.affiliate_name,
      customer: customerName,
      action: action,
      commission: commissionEarned
    });
    console.log('=== END REFERRAL TRACKING DEBUG ===');

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        affiliate_name: affiliate.affiliate_name,
        customer_name: customerName,
        action: action,
        commission_earned: commissionEarned,
        status: status
      }
    });

  } catch (error) {
    console.error('Failed to track referral:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to track referral' },
      { status: 500 }
    );
  }
}

// Helper function to process signup completion
async function processSignupCompletion(referralCode: string, customerEmail: string, customerName: string) {
  console.log('Processing signup completion for:', { referralCode, customerEmail, customerName });

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find the affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select(`
        id,
        user_id,
        affiliate_name,
        referral_code,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('referral_code', referralCode)
      .single();

    if (affiliateError || !affiliate) {
      console.log('❌ Referral code not found in database:', referralCode);
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 404 }
      );
    }

    console.log('✅ Found affiliate:', affiliate.affiliate_name);

    // Check if this customer has already been tracked for this affiliate
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('customer_email', customerEmail.toLowerCase().trim())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing referral:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking referral' },
        { status: 500 }
      );
    }

    if (existingReferral) {
      console.log('Customer already tracked for this affiliate');
      return NextResponse.json(
        { success: false, message: 'Customer already tracked' },
        { status: 409 }
      );
    }

    // Calculate commission based on program type
    const program = affiliate.programs;
    let commissionEarned = 0;
    let status = 'pending';

    if (program.type === 'signup') {
      if (program.commission_type === 'percentage') {
        commissionEarned = program.commission; // For signups, use fixed commission
      } else {
        commissionEarned = program.commission;
      }
      status = 'approved'; // Signups are typically auto-approved
    }

    // Create the referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        user_id: affiliate.user_id,
        affiliate_id: affiliate.id,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_name: customerName,
        signup_date: new Date().toISOString(),
        listings_count: 1, // Signup completion means 1 listing
        purchases_count: 0,
        total_revenue: 0,
        status: status,
        commission_earned: commissionEarned
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating referral:', referralError);
      return NextResponse.json(
        { success: false, message: 'Error creating referral' },
        { status: 500 }
      );
    }

    // Update affiliate stats
    try {
      await supabase
        .from('affiliates')
        .update({
          total_referrals: affiliate.total_referrals + 1,
          total_earnings: affiliate.total_earnings + commissionEarned
        })
        .eq('id', affiliate.id);
    } catch (updateError) {
      console.error('Error updating affiliate stats:', updateError);
      // Don't fail the whole request if stats update fails
    }

    // Send notification to affiliate
    try {
      const notificationResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/notify-affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          referralId: referral.id,
          customerEmail: customerEmail,
          customerName: customerName,
          notificationType: 'new_referral'
        })
      });

      if (notificationResponse.ok) {
        console.log('✅ Affiliate notification sent');
      } else {
        console.log('⚠️ Affiliate notification failed');
      }
    } catch (notificationError) {
      console.error('❌ Error sending affiliate notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        affiliate_name: affiliate.affiliate_name,
        customer_name: customerName,
        commission_earned: commissionEarned,
        status: status
      }
    });

  } catch (error) {
    console.error('Failed to process signup completion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process signup completion' },
      { status: 500 }
    );
  }
}

// Helper function to update Sharetribe user metadata
async function updateSharetribeUserMetadata(userEmail: string, referralCode: string) {
  console.log('🔄 Updating Sharetribe user metadata:', { userEmail, referralCode });

  try {
    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI({
      clientId: process.env.SHARETRIBE_CLIENT_ID!,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET!
    });

    const user = await sharetribeAPI.getUserByEmail(userEmail);

    if (!user) {
      console.log('❌ User not found in Sharetribe:', userEmail);
      return false;
    }

    console.log('✅ Found user in Sharetribe:', user.id);

    const metadata = {
      referralCode: referralCode,
      referredAt: new Date().toISOString(),
      source: 'affiliate_tracking'
    };

    console.log('📝 Updating user metadata with:', metadata);

    const updateSuccess = await sharetribeAPI.updateUserMetadata(user.id, metadata);

    if (updateSuccess) {
      console.log('✅ User metadata updated successfully in Sharetribe');
    } else {
      console.log('⚠️ Failed to update user metadata in Sharetribe');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase
      .from('user_metadata')
      .upsert({
        sharetribe_user_id: user.id,
        user_email: userEmail,
        referral_code: referralCode,
        metadata: metadata,
        updated_at: new Date().toISOString()
      });

    console.log('✅ Metadata stored in database for user:', user.id);

    return true;

  } catch (error) {
    console.error('❌ Error updating Sharetribe user metadata:', error);
    return false;
  }
} 