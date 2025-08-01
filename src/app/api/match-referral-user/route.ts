import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSharetribeAPI } from '@/lib/sharetribe';

export async function POST(request: NextRequest) {
  try {
    console.log('=== MATCH REFERRAL USER ===');
    
    const body = await request.json();
    const { 
      userEmail, 
      userName, 
      sharetribeUserId,
      sessionToken,
      referralCode 
    } = body;
    
    if (!userEmail || !sharetribeUserId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Matching user:', { userEmail, sharetribeUserId, sessionToken, referralCode });
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Find pending referral click
    let referralClick = null;
    
    if (sessionToken) {
      // Try to match by session token first
      const { data: clickByToken, error: tokenError } = await supabase
        .from('referral_clicks')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('status', 'pending_match')
        .single();
      
      if (clickByToken) {
        referralClick = clickByToken;
        console.log('✅ Found referral click by session token');
      }
    }
    
    if (!referralClick && referralCode) {
      // Try to match by referral code and recent clicks
      const { data: clickByCode, error: codeError } = await supabase
        .from('referral_clicks')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('status', 'pending_match')
        .gte('clicked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('clicked_at', { ascending: false })
        .limit(1)
        .single();
      
      if (clickByCode) {
        referralClick = clickByCode;
        console.log('✅ Found referral click by referral code');
      }
    }
    
    if (!referralClick) {
      console.log('❌ No matching referral click found');
      return NextResponse.json(
        { success: false, message: 'No matching referral click found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found referral click:', referralClick.id);
    
    // Get affiliate information
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
      .eq('id', referralClick.affiliate_id)
      .single();
    
    if (affiliateError || !affiliate) {
      console.log('❌ Affiliate not found');
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found affiliate:', affiliate.affiliate_name);
    
    // Check if this customer has already been tracked
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('customer_email', userEmail.toLowerCase().trim())
      .maybeSingle();
    
    if (existingReferral) {
      console.log('Customer already tracked for this affiliate');
      
      // Update referral click status
      await supabase
        .from('referral_clicks')
        .update({
          status: 'matched',
          matched_user_id: sharetribeUserId,
          matched_at: new Date().toISOString()
        })
        .eq('id', referralClick.id);
      
      return NextResponse.json(
        { success: false, message: 'Customer already tracked' },
        { status: 409 }
      );
    }
    
    // Update Sharetribe user metadata with referral information
    try {
      const sharetribeAPI = createSharetribeAPI({
        clientId: process.env.SHARETRIBE_CLIENT_ID!,
        clientSecret: process.env.SHARETRIBE_CLIENT_SECRET!
      });
      
      // Add referral metadata to Sharetribe user
      const metadataUpdate = {
        referralCode: referralCode,
        affiliateId: affiliate.id,
        affiliateName: affiliate.affiliate_name,
        referredAt: new Date().toISOString(),
        clickId: referralClick.id
      };
      
      console.log('Updating Sharetribe user metadata:', metadataUpdate);
      
      // Note: This would require Sharetribe API endpoint for updating user metadata
      // For now, we'll store this information in our database
      
    } catch (error) {
      console.error('❌ Error updating Sharetribe metadata:', error);
      // Continue with referral creation even if metadata update fails
    }
    
    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        user_id: affiliate.user_id,
        affiliate_id: affiliate.id,
        customer_email: userEmail.toLowerCase().trim(),
        customer_name: userName || 'Unknown',
        signup_date: new Date().toISOString(),
        listings_count: 1,
        purchases_count: 0,
        total_revenue: 0,
        status: 'pending',
        commission: 0,
        sharetribe_user_id: sharetribeUserId,
        referral_click_id: referralClick.id
      })
      .select()
      .single();
    
    if (referralError) {
      console.error('❌ Error creating referral:', referralError);
      return NextResponse.json(
        { success: false, message: 'Error creating referral' },
        { status: 500 }
      );
    }
    
    // Update referral click status
    await supabase
      .from('referral_clicks')
      .update({
        status: 'matched',
        matched_user_id: sharetribeUserId,
        matched_at: new Date().toISOString()
      })
      .eq('id', referralClick.id);
    
    console.log('✅ Referral matched and created successfully');
    
    // Notify affiliate of successful referral
    try {
      const notificationResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/notify-affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          referralId: referral.id,
          customerEmail: userEmail,
          customerName: userName || 'Unknown',
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
    
    console.log('=== END MATCH REFERRAL USER ===');
    
    return NextResponse.json({
      success: true,
      message: 'Referral matched successfully',
      referral: {
        id: referral.id,
        affiliateName: affiliate.affiliate_name,
        customerEmail: userEmail,
        status: referral.status
      }
    });
    
  } catch (error) {
    console.error('❌ Match referral user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 