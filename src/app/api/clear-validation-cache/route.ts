import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🧹 Clearing validation cache for user:', userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Clear all validation cache by setting status and updated_at to null
    const { error: clearError } = await supabase
      .from('referrals')
      .update({
        sharetribe_validation_status: null,
        sharetribe_validation_updated_at: null
      })
      .eq('affiliate_id', userId);

    if (clearError) {
      console.error('❌ Error clearing cache:', clearError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to clear cache',
        error: clearError
      });
    }

    console.log('✅ Validation cache cleared successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Validation cache cleared successfully'
    });

  } catch (error) {
    console.error('❌ Clear cache error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Clear cache failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 