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

    // First, test if the columns already exist
    const { data: testData, error: testError } = await supabase
      .from('affiliates')
      .select('bank_account_name')
      .limit(1);

    if (!testError) {
      // Columns already exist
      return NextResponse.json({
        success: true,
        message: 'Bank details columns already exist',
        testData
      });
    }

    if (!testError.message.includes('column "bank_account_name" does not exist')) {
      // Some other error occurred
      return NextResponse.json({
        success: false,
        message: 'Test query failed',
        error: testError.message
      }, { status: 500 });
    }

    // Columns don't exist, try to run migration
    // Note: This will likely fail in production as RPC methods are not typically available
    // The user will need to run the migration manually
    return NextResponse.json({
      success: false,
      message: 'Bank details columns do not exist',
      error: 'Migration required',
      suggestion: 'Please run the migration manually in your Supabase dashboard using the SQL from BANK_DETAILS_MIGRATION_GUIDE.md'
    }, { status: 500 });



  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { success: false, message: 'Migration failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 