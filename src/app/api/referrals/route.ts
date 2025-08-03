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

    // Fetch referrals with affiliate and program information
    const { data: referrals, error } = await authenticatedSupabase
      .from('referrals')
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
          commission,
          commission_type,
          type
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    // Transform the data to include affiliate information and calculate commission dynamically
    const transformedReferrals = referrals?.map(referral => {
      // Calculate commission based on program settings
      const program = referral.programs;
      let calculatedCommission = 0;
      
      if (program) {
        if (program.type === 'reward') {
          // Reward programs have £0 commission
          calculatedCommission = 0;
        } else if (program.commission_type === 'fixed') {
          calculatedCommission = program.commission;
        } else if (program.commission_type === 'percentage') {
          // For percentage, we need a base amount - using a default of 100 for now
          // In a real scenario, this would be the actual transaction amount
          calculatedCommission = (program.commission / 100) * 100; // Default base amount
        }
      }
      
      return {
        id: referral.id,
        affiliate_id: referral.affiliate_id,
        affiliate_name: referral.affiliates?.name || 'Unknown Affiliate',
        affiliate_email: referral.affiliates?.email || 'No email',
        customer_email: referral.customer_email,
        customer_name: referral.customer_name,
        status: referral.status || 'pending',
        commission: calculatedCommission,
        referral_code: referral.referral_code,
        created_at: referral.created_at,
        // Program information
        program_name: program?.name || 'Unknown Program',
        program_commission: program?.commission || 0,
        program_commission_type: program?.commission_type || 'fixed',
        // ShareTribe fields
        sharetribe_user_id: referral.sharetribe_user_id,
        sharetribe_created_at: referral.sharetribe_created_at,
        listings_count: referral.listings_count,
        transactions_count: referral.transactions_count,
        total_revenue: referral.total_revenue,
        last_sync_at: referral.last_sync_at,
        // Validation fields
        sharetribe_validation_status: referral.sharetribe_validation_status,
        sharetribe_validation_updated_at: referral.sharetribe_validation_updated_at
      };
    }) || [];

    return NextResponse.json({ 
      success: true, 
      referrals: transformedReferrals 
    });
  } catch (error) {
    console.error('Failed to fetch referrals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
} 