import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== REFERRAL TRACKING DEBUG ===');
    console.log('Request received at:', new Date().toISOString());
    
    const body = await request.json();
    console.log('Request body:', body);
    
    let { 
      referralCode, 
      customerEmail, 
      customerName, 
      action, // 'signup' or 'purchase'
      amount = 0, // for purchases
      listingsCount = 0 // for signups
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

    if (!customerEmail || !customerName || !action) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If still no referral code, return success but log it
    if (!referralCode) {
      console.log('❌ No referral code found for customer:', customerEmail);
      console.log('=== END REFERRAL TRACKING DEBUG ===');
      return NextResponse.json({
        success: true,
        message: 'No referral code found',
        referral: null
      });
    }

    console.log('✅ Using referral code:', referralCode);

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
        name as affiliate_name,
        email as affiliate_email,
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