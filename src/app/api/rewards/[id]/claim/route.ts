import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const rewardId = params.id;

    // Get the reward record
    const { data: reward, error: rewardError } = await authenticatedSupabase
      .from('rewards')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        ),
        programs (
          id,
          name,
          referral_target
        )
      `)
      .eq('id', rewardId)
      .eq('user_id', user.id)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json(
        { success: false, message: 'Reward not found' },
        { status: 404 }
      );
    }

    // Check if reward is qualified
    if (reward.status !== 'qualified') {
      return NextResponse.json(
        { success: false, message: 'Reward is not qualified for claiming' },
        { status: 400 }
      );
    }

    // Update reward status to claimed
    const { error: updateError } = await authenticatedSupabase
      .from('rewards')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString()
      })
      .eq('id', rewardId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating reward:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to claim reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reward claimed successfully',
      reward: {
        id: reward.id,
        affiliate: reward.affiliates,
        program: reward.programs,
        status: 'claimed',
        claimed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to claim reward:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to claim reward' },
      { status: 500 }
    );
  }
} 