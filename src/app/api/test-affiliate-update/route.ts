import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST AFFILIATE UPDATE DEBUG ===');
    
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);
    
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
    
    console.log('✅ Authenticated client created');
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    const body = await request.json();
    console.log('Test affiliate update body:', body);
    
    // Test the update directly
    console.log('Attempting update with:', {
      affiliateId: body.affiliateId,
      updates: body.updates,
      userId: user.id
    });
    
    const { data, error } = await authenticatedSupabase
      .from('affiliates')
      .update(body.updates)
      .eq('id', body.affiliateId)
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

    if (error) {
      console.error('❌ Database update error:', error);
      console.log('=== END TEST AFFILIATE UPDATE DEBUG ===');
      return NextResponse.json(
        { success: false, message: 'Database update failed', error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Database update successful:', data);
    console.log('=== END TEST AFFILIATE UPDATE DEBUG ===');
    return NextResponse.json({ success: true, affiliate: data });
    
  } catch (error) {
    console.error('❌ Test affiliate update failed:', error);
    console.log('=== END TEST AFFILIATE UPDATE DEBUG ===');
    return NextResponse.json(
      { success: false, message: 'Test failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 