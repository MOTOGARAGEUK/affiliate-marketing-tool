import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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

    // Check if reward programs are enabled in settings
    const { data: settings, error: settingsError } = await authenticatedSupabase
      .from('settings')
      .select('setting_value')
      .eq('user_id', user.id)
      .eq('setting_type', 'general')
      .eq('setting_key', 'enableRewardPrograms')
      .single();

    if (settingsError || !settings || settings.setting_value !== true) {
      return NextResponse.json(
        { success: false, message: 'Reward programs are not enabled' },
        { status: 403 }
      );
    }

    // Fetch all affiliates with their reward programs and referral counts
    const { data: affiliates, error: affiliatesError } = await authenticatedSupabase
      .from('affiliates')
      .select(`
        id,
        name,
        email,
        program_id,
        programs (
          id,
          name,
          type,
          referral_target
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (affiliatesError) {
      console.error('Error fetching affiliates:', affiliatesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch affiliates' },
        { status: 500 }
      );
    }

    // Filter affiliates who are in reward programs
    const rewardAffiliates = affiliates?.filter(affiliate => 
      affiliate.programs?.type === 'reward'
    ) || [];

    // Get verified referral counts for each affiliate
    const rewardsData = await Promise.all(
      rewardAffiliates.map(async (affiliate) => {
        const { count: verifiedReferrals } = await authenticatedSupabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', affiliate.id)
          .eq('sharetribe_validation_status', 'green');

        // Check if affiliate qualifies for reward
        const referralTarget = affiliate.programs?.referral_target || 0;
        const hasQualified = (verifiedReferrals || 0) >= referralTarget;

        // Check if there's already a reward record
        const { data: existingReward } = await authenticatedSupabase
          .from('rewards')
          .select('*')
          .eq('affiliate_id', affiliate.id)
          .eq('program_id', affiliate.program_id)
          .single();

        let status = 'pending';
        let qualifiedAt = null;

        if (hasQualified) {
          if (existingReward) {
            status = existingReward.status;
            qualifiedAt = existingReward.qualified_at;
          } else {
            // Create new reward record
            const { data: newReward, error: createError } = await authenticatedSupabase
              .from('rewards')
              .insert({
                affiliate_id: affiliate.id,
                program_id: affiliate.program_id,
                status: 'qualified',
                qualified_at: new Date().toISOString(),
                user_id: user.id
              })
              .select()
              .single();

            if (!createError && newReward) {
              status = 'qualified';
              qualifiedAt = newReward.qualified_at;
            }
          }
        } else if (existingReward) {
          status = existingReward.status;
          qualifiedAt = existingReward.qualified_at;
        }

        return {
          id: existingReward?.id || `temp-${affiliate.id}`,
          affiliate: {
            id: affiliate.id,
            name: affiliate.name,
            email: affiliate.email
          },
          program: {
            id: affiliate.programs?.id,
            name: affiliate.programs?.name,
            referral_target: affiliate.programs?.referral_target
          },
          verified_referrals: verifiedReferrals || 0,
          status,
          qualified_at: qualifiedAt,
          created_at: existingReward?.created_at || new Date().toISOString()
        };
      })
    );

    // Filter out affiliates who don't have any reward activity yet
    const activeRewards = rewardsData.filter(reward => 
      reward.status !== 'pending' || reward.verified_referrals > 0
    );

    return NextResponse.json({ 
      success: true, 
      rewards: activeRewards
    });
  } catch (error) {
    console.error('Failed to fetch rewards:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
} 