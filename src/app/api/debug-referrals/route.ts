import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test 1: Basic table access
    const { data: basicData, error: basicError } = await supabase
      .from('referrals')
      .select('*')
      .limit(1);

    if (basicError) {
      return NextResponse.json({
        success: false,
        test: 'basic_access',
        error: basicError.message,
        code: basicError.code
      }, { status: 500 });
    }

    // Test 2: Check table structure
    const { data: structureData, error: structureError } = await supabase
      .from('referrals')
      .select('id, created_at, commission_earned, user_id')
      .limit(0);

    if (structureError) {
      return NextResponse.json({
        success: false,
        test: 'structure_check',
        error: structureError.message,
        code: structureError.code
      }, { status: 500 });
    }

    // Test 3: Date range query (the one causing 400 errors)
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const { data: dateData, error: dateError } = await supabase
      .from('referrals')
      .select('id, created_at, commission_earned')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .limit(5);

    if (dateError) {
      return NextResponse.json({
        success: false,
        test: 'date_range_query',
        error: dateError.message,
        code: dateError.code,
        query: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }, { status: 500 });
    }

    // Test 4: Count query
    const { count: countData, error: countError } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    if (countError) {
      return NextResponse.json({
        success: false,
        test: 'count_query',
        error: countError.message,
        code: countError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tests: {
        basic_access: 'PASS',
        structure_check: 'PASS',
        date_range_query: 'PASS',
        count_query: 'PASS'
      },
      sampleData: basicData,
      dateQueryData: dateData,
      countData: countData,
      queryParams: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Debug referrals error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 