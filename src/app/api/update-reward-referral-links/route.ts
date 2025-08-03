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

    // Get marketplace URL from settings
    let marketplaceUrl = 'https://marketplace.com'; // fallback
    try {
      const { data: sharetribeSettings } = await authenticatedSupabase
        .from('settings')
        .select('setting_key, setting_value')
        .eq('user_id', user.id)
        .eq('setting_type', 'sharetribe');
      
      const marketplaceUrlSetting = sharetribeSettings?.find(s => 
        s.setting_key === 'marketplaceUrl' || 
        s.setting_key === 'marketplace_url' || 
        s.setting_key === 'url'
      );
      
      if (marketplaceUrlSetting?.setting_value) {
        marketplaceUrl = marketplaceUrlSetting.setting_value;
      }
    } catch (error) {
      console.error('Error fetching marketplace URL:', error);
    }

    // Get all affiliates in reward programs that need updated referral links
    const { data: affiliates, error: affiliatesError } = await authenticatedSupabase
      .from('affiliates')
      .select(`
        id,
        referral_code,
        referral_link,
        programs (
          id,
          type
        )
      `)
      .eq('user_id', user.id)
      .eq('programs.type', 'reward');

    if (affiliatesError) {
      console.error('Error fetching affiliates:', affiliatesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch affiliates' },
        { status: 500 }
      );
    }

    const cleanUrl = marketplaceUrl.replace(/\/+$/, '');
    let updatedCount = 0;

    // Update referral links for reward program affiliates
    for (const affiliate of affiliates || []) {
      if (affiliate.referral_code && affiliate.referral_link) {
        // Check if the current link doesn't have /signup
        if (!affiliate.referral_link.includes('/signup')) {
          const newReferralLink = `${cleanUrl}/signup?utm_source=affiliate&utm_medium=referral&utm_campaign=${affiliate.referral_code}`;
          
          const { error: updateError } = await authenticatedSupabase
            .from('affiliates')
            .update({ referral_link: newReferralLink })
            .eq('id', affiliate.id)
            .eq('user_id', user.id);

          if (!updateError) {
            updatedCount++;
            console.log(`Updated affiliate ${affiliate.id} referral link to: ${newReferralLink}`);
          } else {
            console.error(`Failed to update affiliate ${affiliate.id}:`, updateError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} affiliate referral links for reward programs`,
      updatedCount
    });
  } catch (error) {
    console.error('Failed to update reward referral links:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update reward referral links' },
      { status: 500 }
    );
  }
} 