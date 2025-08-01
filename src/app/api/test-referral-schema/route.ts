import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Use service role key to bypass RLS for schema inspection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get a sample referral to see what fields exist
    const { data: sampleReferral, error: sampleError } = await supabase
      .from('referrals')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('Error fetching sample referral:', sampleError);
      return NextResponse.json(
        { success: false, message: 'Error fetching sample referral', error: sampleError },
        { status: 500 }
      );
    }

    // Get column information from information_schema
    let columns = null;
    let columnsError = null;
    
    try {
      const result = await supabase
        .rpc('get_table_columns', { table_name: 'referrals' });
      columns = result.data;
      columnsError = result.error;
    } catch (error) {
      columnsError = 'RPC not available';
    }

    return NextResponse.json({
      success: true,
      sampleReferral: sampleReferral,
      availableFields: Object.keys(sampleReferral || {}),
      columns: columns,
      columnsError: columnsError
    });

  } catch (error) {
    console.error('Failed to test referral schema:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test referral schema',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 