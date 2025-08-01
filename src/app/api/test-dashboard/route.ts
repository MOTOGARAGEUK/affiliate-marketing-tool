import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test basic database connection
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('*')
      .limit(5);

    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .limit(5);

    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        affiliates: {
          count: affiliates?.length || 0,
          data: affiliates,
          error: affiliatesError
        },
        referrals: {
          count: referrals?.length || 0,
          data: referrals,
          error: referralsError
        },
        programs: {
          count: programs?.length || 0,
          data: programs,
          error: programsError
        }
      }
    });

  } catch (error) {
    console.error('Test dashboard error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 