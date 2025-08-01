import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('referrals')
      .select('id, created_at')
      .limit(1);

    if (testError) {
      console.error('Database connection test failed:', testError);
      return NextResponse.json({
        success: false,
        error: testError.message,
        code: testError.code
      }, { status: 500 });
    }

    // Test date range query
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const { data: dateTestData, error: dateTestError } = await supabase
      .from('referrals')
      .select('id, created_at, commission_earned')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .limit(5);

    if (dateTestError) {
      console.error('Date range query test failed:', dateTestError);
      return NextResponse.json({
        success: false,
        error: dateTestError.message,
        code: dateTestError.code,
        query: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }, { status: 500 });
    }

    // Test table structure
    const { data: structureData, error: structureError } = await supabase
      .from('referrals')
      .select('*')
      .limit(0);

    return NextResponse.json({
      success: true,
      connection: 'OK',
      dateQuery: 'OK',
      sampleData: testData,
      dateTestData: dateTestData,
      tableStructure: structureError ? 'Error getting structure' : 'OK',
      structureError: structureError?.message
    });

  } catch (error) {
    console.error('Schema test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 