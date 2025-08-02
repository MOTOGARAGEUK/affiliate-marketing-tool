import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Test query to check if bank details columns exist
    const { data: testAffiliate, error: testError } = await supabase
      .from('affiliates')
      .select('id, name, bank_account_name, bank_account_number, bank_sort_code, bank_iban, bank_routing_number, bank_name')
      .eq('user_id', user.id)
      .limit(1);

    if (testError) {
      console.error('Schema test error:', testError);
      return NextResponse.json({
        success: false,
        message: 'Schema test failed',
        error: testError.message,
        code: testError.code
      }, { status: 500 });
    }

    // Also try to get a specific affiliate to test the full query
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select(`
        *,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('user_id', user.id)
      .limit(1);

    if (affiliatesError) {
      console.error('Full query error:', affiliatesError);
      return NextResponse.json({
        success: false,
        message: 'Full query failed',
        error: affiliatesError.message,
        code: affiliatesError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      testAffiliate,
      fullQueryResult: affiliates,
      message: 'Schema test completed successfully'
    });

  } catch (error) {
    console.error('Schema test failed:', error);
    return NextResponse.json(
      { success: false, message: 'Schema test failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 