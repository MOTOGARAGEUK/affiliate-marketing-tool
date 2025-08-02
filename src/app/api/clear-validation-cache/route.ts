import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    // Clear all validation cache
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        sharetribe_validation_status: null,
        sharetribe_validation_updated_at: null
      })
      .not('sharetribe_validation_status', 'is', null);

    if (updateError) {
      console.error('❌ Failed to clear validation cache:', updateError);
      return NextResponse.json({ success: false, message: 'Failed to clear cache' }, { status: 500 });
    }

    console.log('✅ Validation cache cleared successfully');

    return NextResponse.json({
      success: true,
      message: 'Validation cache cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error clearing validation cache:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to clear validation cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 