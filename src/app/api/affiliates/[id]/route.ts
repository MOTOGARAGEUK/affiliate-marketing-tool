import { NextRequest, NextResponse } from 'next/server';
import { affiliatesAPI } from '@/lib/database';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const affiliate = await affiliatesAPI.getById(params.id, user.id);
    
    if (affiliate) {
      return NextResponse.json({ success: true, affiliate });
    } else {
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to fetch affiliate:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliate' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    console.log('Update affiliate body:', body);
    
    // Temporarily filter out bank details to test if that's the issue
    const { 
      bank_account_name, 
      bank_account_number, 
      bank_sort_code, 
      bank_iban, 
      bank_routing_number, 
      bank_name, 
      ...updateData 
    } = body;
    
    console.log('Filtered update data:', updateData);
    
    try {
      const affiliate = await affiliatesAPI.update(params.id, updateData, user.id);
      
      if (affiliate) {
        return NextResponse.json({ success: true, affiliate });
      } else {
        return NextResponse.json(
          { success: false, message: 'Affiliate not found' },
          { status: 404 }
        );
      }
    } catch (updateError) {
      console.error('Update error details:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Failed to update affiliate:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update affiliate' },
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