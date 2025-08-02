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

    const affiliateId = '3aa1ce90-547a-47c8-9d0b-e3dc5a6e320a';

    // Test 1: Check if the affiliate exists at all
    const { data: affiliateExists, error: existsError } = await supabase
      .from('affiliates')
      .select('id, name, user_id')
      .eq('id', affiliateId)
      .single();

    if (existsError) {
      return NextResponse.json({
        success: false,
        message: 'Affiliate not found or access denied',
        error: existsError.message,
        code: existsError.code,
        affiliateId: affiliateId,
        userId: user.id
      }, { status: 404 });
    }

    // Test 2: Check if the affiliate belongs to the current user
    if (affiliateExists.user_id !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Affiliate does not belong to current user',
        affiliateUserId: affiliateExists.user_id,
        currentUserId: user.id,
        affiliateId: affiliateId
      }, { status: 403 });
    }

    // Test 3: Try to get the affiliate with minimal fields
    const { data: minimalData, error: minimalError } = await supabase
      .from('affiliates')
      .select('id, name, email, program_id')
      .eq('id', affiliateId)
      .eq('user_id', user.id)
      .single();

    if (minimalError) {
      return NextResponse.json({
        success: false,
        message: 'Minimal affiliate query failed',
        error: minimalError.message,
        code: minimalError.code,
        affiliateId: affiliateId
      }, { status: 500 });
    }

    // Test 4: Try to get the affiliate with bank details
    const { data: bankData, error: bankError } = await supabase
      .from('affiliates')
      .select('id, name, bank_account_name, bank_account_number, bank_sort_code, bank_iban, bank_routing_number, bank_name')
      .eq('id', affiliateId)
      .eq('user_id', user.id)
      .single();

    if (bankError) {
      return NextResponse.json({
        success: false,
        message: 'Bank details query failed',
        error: bankError.message,
        code: bankError.code,
        affiliateId: affiliateId,
        minimalData: minimalData
      }, { status: 500 });
    }

    // Test 5: Try the full query that the API uses
    const { data: fullData, error: fullError } = await supabase
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
      .eq('id', affiliateId)
      .eq('user_id', user.id)
      .single();

    if (fullError) {
      return NextResponse.json({
        success: false,
        message: 'Full affiliate query failed',
        error: fullError.message,
        code: fullError.code,
        affiliateId: affiliateId,
        minimalData: minimalData,
        bankData: bankData
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      affiliateId: affiliateId,
      minimalData: minimalData,
      bankData: bankData,
      fullData: fullData
    });

  } catch (error) {
    console.error('Specific affiliate test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Specific affiliate test failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 