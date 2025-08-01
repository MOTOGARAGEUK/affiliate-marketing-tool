import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('=== REFERRAL REDIRECT HANDLER ===');
    
    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get('ref');
    const marketplaceUrl = searchParams.get('to') || process.env.SHARETRIBE_MARKETPLACE_URL;
    
    if (!referralCode) {
      console.log('❌ No referral code provided');
      return NextResponse.redirect(marketplaceUrl || 'https://your-marketplace.sharetribe.com');
    }
    
    if (!marketplaceUrl) {
      console.log('❌ No marketplace URL configured');
      return NextResponse.json({ error: 'Marketplace URL not configured' }, { status: 500 });
    }
    
    console.log('✅ Processing referral redirect for code:', referralCode);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Find the affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, name, referral_code')
      .eq('referral_code', referralCode)
      .single();
    
    if (affiliateError || !affiliate) {
      console.log('❌ Invalid referral code:', referralCode);
      // Still redirect to marketplace, just don't track
      return NextResponse.redirect(marketplaceUrl);
    }
    
    console.log('✅ Found affiliate:', affiliate.name);
    
    // Store referral click in tracking table
    const { data: clickData, error: clickError } = await supabase
      .from('referral_clicks')
      .insert({
        affiliate_id: affiliate.id,
        referral_code: referralCode,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        clicked_at: new Date().toISOString(),
        status: 'pending_match'
      })
      .select()
      .single();
    
    if (clickError) {
      console.error('❌ Error storing referral click:', clickError);
      // Still redirect even if tracking fails
      return NextResponse.redirect(marketplaceUrl);
    }
    
    console.log('✅ Referral click stored with ID:', clickData.id);
    
    // Create a unique session token for this click
    const sessionToken = `ref_${clickData.id}_${Date.now()}`;
    
    // Redirect to marketplace with session token
    const redirectUrl = new URL(marketplaceUrl);
    redirectUrl.searchParams.set('ref_session', sessionToken);
    redirectUrl.searchParams.set('ref_code', referralCode);
    
    console.log('✅ Redirecting to marketplace with session token');
    console.log('=== END REFERRAL REDIRECT HANDLER ===');
    
    return NextResponse.redirect(redirectUrl.toString());
    
  } catch (error) {
    console.error('❌ Referral redirect error:', error);
    // Fallback redirect
    const marketplaceUrl = process.env.SHARETRIBE_MARKETPLACE_URL || 'https://your-marketplace.sharetribe.com';
    return NextResponse.redirect(marketplaceUrl);
  }
} 