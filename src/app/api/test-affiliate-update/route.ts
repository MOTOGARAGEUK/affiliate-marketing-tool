import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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
    console.log('Test affiliate update body:', body);
    
    // Test the update directly
    const { data, error } = await supabase
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
      console.error('Database update error:', error);
      return NextResponse.json(
        { success: false, message: 'Database update failed', error: error.message },
        { status: 500 }
      );
    }
    
    console.log('Database update successful:', data);
    return NextResponse.json({ success: true, affiliate: data });
    
  } catch (error) {
    console.error('Test affiliate update failed:', error);
    return NextResponse.json(
      { success: false, message: 'Test failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 