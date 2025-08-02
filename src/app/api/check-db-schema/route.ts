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

    // Check the current schema of the affiliates table
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'affiliates' });

    if (schemaError) {
      // If the RPC doesn't exist, try a different approach
      // Try to query information_schema directly
      const { data: columnInfo, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'affiliates')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (columnError) {
        return NextResponse.json({
          success: false,
          message: 'Failed to get schema information',
          error: columnError.message,
          code: columnError.code
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Schema retrieved via information_schema',
        columns: columnInfo,
        bankColumnsExist: columnInfo.some((col: any) => col.column_name.startsWith('bank_')),
        bankColumns: columnInfo.filter((col: any) => col.column_name.startsWith('bank_'))
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Schema retrieved via RPC',
      schema: schemaData
    });

  } catch (error) {
    console.error('Schema check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Schema check failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 