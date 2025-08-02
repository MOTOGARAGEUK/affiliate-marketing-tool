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

    // Test 1: Check if we can query the affiliates table at all
    const { data: basicQuery, error: basicError } = await supabase
      .from('affiliates')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1);

    if (basicError) {
      return NextResponse.json({
        success: false,
        message: 'Basic affiliate query failed',
        error: basicError.message,
        code: basicError.code,
        details: basicError.details,
        hint: basicError.hint
      }, { status: 500 });
    }

    // Test 2: Check if bank details columns exist
    const { data: bankQuery, error: bankError } = await supabase
      .from('affiliates')
      .select('id, name, bank_account_name, bank_account_number, bank_sort_code, bank_iban, bank_routing_number, bank_name')
      .eq('user_id', user.id)
      .limit(1);

    if (bankError) {
      return NextResponse.json({
        success: false,
        message: 'Bank details query failed',
        error: bankError.message,
        code: bankError.code,
        details: bankError.details,
        hint: bankError.hint,
        basicQuerySuccess: true,
        basicQueryData: basicQuery
      }, { status: 500 });
    }

    // Test 3: Check the full query that the affiliate API uses
    const { data: fullQuery, error: fullError } = await supabase
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

    if (fullError) {
      return NextResponse.json({
        success: false,
        message: 'Full affiliate query failed',
        error: fullError.message,
        code: fullError.code,
        details: fullError.details,
        hint: fullError.hint,
        basicQuerySuccess: true,
        bankQuerySuccess: true,
        basicQueryData: basicQuery,
        bankQueryData: bankQuery
      }, { status: 500 });
    }

    // Test 4: Check specific affiliate ID that was failing
    const specificAffiliateId = '3aa1ce90-547a-47c8-9d0b-e3dc5a6e320a';
    const { data: specificQuery, error: specificError } = await supabase
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
      .eq('id', specificAffiliateId)
      .eq('user_id', user.id)
      .single();

    if (specificError) {
      return NextResponse.json({
        success: false,
        message: 'Specific affiliate query failed',
        error: specificError.message,
        code: specificError.code,
        details: specificError.details,
        hint: specificError.hint,
        affiliateId: specificAffiliateId,
        basicQuerySuccess: true,
        bankQuerySuccess: true,
        fullQuerySuccess: true,
        basicQueryData: basicQuery,
        bankQueryData: bankQuery,
        fullQueryData: fullQuery
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All queries successful',
      basicQueryData: basicQuery,
      bankQueryData: bankQuery,
      fullQueryData: fullQuery,
      specificQueryData: specificQuery,
      affiliateId: specificAffiliateId
    });

  } catch (error) {
    console.error('Debug endpoint failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Debug endpoint failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 