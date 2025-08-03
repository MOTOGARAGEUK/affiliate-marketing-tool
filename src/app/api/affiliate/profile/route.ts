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

    // Find the affiliate record for this user
    const { data: affiliate, error: affiliateError } = await authenticatedSupabase
      .from('affiliates')
      .select(`
        id,
        name,
        email,
        phone,
        status,
        referral_code,
        created_at,
        updated_at,
        program_id,
        programs (
          id,
          name,
          type,
          commission,
          commission_type,
          referral_target
        )
      `)
      .eq('email', user.email)
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      affiliate
    });
  } catch (error) {
    console.error('Failed to fetch affiliate profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliate profile' },
      { status: 500 }
    );
  }
} 