import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId parameter required' },
        { status: 400 }
      );
    }

    console.log('Checking integrations for user:', userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all integrations for this user
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch integrations', error },
        { status: 500 }
      );
    }

    console.log('Found integrations:', integrations);

    return NextResponse.json({
      success: true,
      integrations: integrations || [],
      count: integrations?.length || 0
    });

  } catch (error) {
    console.error('Integration test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 