import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Affiliates GET - Starting...');
    console.log('Affiliates GET - Fetching affiliate ID:', params.id);
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Affiliates GET - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('Affiliates GET - ❌ No authorization header');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Affiliates GET - Token length:', token.length);
    
    // Create an authenticated client with the user's token (same as POST)
    const { createClient } = await import('@supabase/supabase-js');
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
    
    console.log('Affiliates GET - Authenticated client created');
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Affiliates GET - ❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Affiliates GET - ✅ User authenticated:', user.id);

    // Direct query approach - bypass database layer
    console.log('Affiliates GET - Trying direct query...');
    const { data: affiliate, error: queryError } = await authenticatedSupabase
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
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (queryError) {
      console.log('Affiliates GET - ❌ Query error:', queryError);
      
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Affiliate not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to fetch affiliate', error: queryError.message },
        { status: 500 }
      );
    }

    if (!affiliate) {
      console.log('Affiliates GET - ❌ No affiliate data returned');
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }

    console.log('Affiliates GET - ✅ Affiliate found');
    console.log('Affiliates GET - Affiliate data keys:', Object.keys(affiliate));
    console.log('Affiliates GET - Bank details present:', {
      bank_name: !!affiliate.bank_name,
      bank_account_name: !!affiliate.bank_account_name,
      bank_account_number: !!affiliate.bank_account_number,
      bank_sort_code: !!affiliate.bank_sort_code,
      bank_iban: !!affiliate.bank_iban,
      bank_routing_number: !!affiliate.bank_routing_number
    });
    
    return NextResponse.json({ success: true, affiliate });
    
  } catch (error) {
    console.error('Affiliates GET - ❌ Failed:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliate', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Affiliates PUT - Starting...');
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Affiliates PUT - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Affiliates PUT - Token length:', token.length);
    
    // Create an authenticated client with the user's token (same as POST)
    const { createClient } = await import('@supabase/supabase-js');
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
    
    console.log('Affiliates PUT - Authenticated client created');
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Affiliates PUT - Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Affiliates PUT - User authenticated:', user.id);

    const body = await request.json();
    console.log('Affiliates PUT - Request body:', body);
    
    try {
      console.log('Affiliates PUT - Calling update with:', { id: params.id, body, userId: user.id });
      
      const { data: affiliate, error: updateError } = await authenticatedSupabase
        .from('affiliates')
        .update(body)
        .eq('id', params.id)
        .eq('user_id', user.id)
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
        .single();
      
      if (updateError) {
        console.error('Affiliates PUT - Update error details:', updateError);
        throw updateError;
      }
      
      if (affiliate) {
        console.log('Affiliates PUT - Update successful, returning affiliate:', affiliate);
        return NextResponse.json({ success: true, affiliate });
      } else {
        console.log('Affiliates PUT - Update returned null/undefined');
        return NextResponse.json(
          { success: false, message: 'Affiliate not found' },
          { status: 404 }
        );
      }
    } catch (updateError) {
      console.error('Affiliates PUT - Update error details:', updateError);
      console.error('Affiliates PUT - Update error stack:', updateError instanceof Error ? updateError.stack : 'No stack trace');
      throw updateError;
    }
  } catch (error) {
    console.error('Affiliates PUT - Failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update affiliate',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DELETE AFFILIATE DEBUG ===');
    console.log('Deleting affiliate ID:', params.id);
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);
    
    // Create an authenticated client with the user's token
    const { createClient } = await import('@supabase/supabase-js');
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
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    try {
      // First, check if the affiliate exists and belongs to this user
      const { data: existingAffiliate, error: checkError } = await authenticatedSupabase
        .from('affiliates')
        .select('id, name')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

      if (checkError || !existingAffiliate) {
        console.log('❌ Affiliate not found or access denied:', checkError);
        return NextResponse.json(
          { success: false, message: 'Affiliate not found' },
          { status: 404 }
        );
      }

      console.log('✅ Found affiliate to delete:', existingAffiliate.name);

      // Delete related records first (referrals, payouts)
      console.log('Deleting related referrals...');
      const { error: referralsError } = await authenticatedSupabase
        .from('referrals')
        .delete()
        .eq('affiliate_id', params.id)
        .eq('user_id', user.id);

      if (referralsError) {
        console.error('❌ Error deleting referrals:', referralsError);
      } else {
        console.log('✅ Referrals deleted successfully');
      }

      console.log('Deleting related payouts...');
      const { error: payoutsError } = await authenticatedSupabase
        .from('payouts')
        .delete()
        .eq('affiliate_id', params.id)
        .eq('user_id', user.id);

      if (payoutsError) {
        console.error('❌ Error deleting payouts:', payoutsError);
      } else {
        console.log('✅ Payouts deleted successfully');
      }

      // Now delete the affiliate
      console.log('Deleting affiliate...');
      const { data: deleteResult, error: deleteError } = await authenticatedSupabase
        .from('affiliates')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select();

      if (deleteError) {
        console.error('❌ Error deleting affiliate:', deleteError);
        return NextResponse.json(
          { success: false, message: 'Failed to delete affiliate', error: deleteError.message },
          { status: 500 }
        );
      }

      console.log('✅ Affiliate deleted successfully:', deleteResult);
      console.log('=== END DELETE AFFILIATE DEBUG ===');
      return NextResponse.json({ 
        success: true, 
        message: 'Affiliate deleted successfully',
        deletedAffiliate: deleteResult?.[0]
      });
      
    } catch (deleteError) {
      console.error('❌ Error in delete operation:', deleteError);
      console.log('=== END DELETE AFFILIATE DEBUG ===');
      return NextResponse.json(
        { success: false, message: 'Failed to delete affiliate', error: deleteError instanceof Error ? deleteError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Failed to delete affiliate:', error);
    console.log('=== END DELETE AFFILIATE DEBUG ===');
    return NextResponse.json(
      { success: false, message: 'Failed to delete affiliate' },
      { status: 500 }
    );
  }
} 