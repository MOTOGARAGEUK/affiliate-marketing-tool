import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Refresh Schema GET - Starting...');
    const supabase = createServerClient();
    
    // Try to refresh the schema cache by making a simple query
    console.log('Refresh Schema GET - Refreshing schema cache...');
    
    try {
      // This query should refresh the schema cache
      const { data, error } = await supabase
        .from('integrations')
        .select('id, name, type, status, config, user_id, created_at, updated_at')
        .limit(1);
      
      console.log('Refresh Schema GET - Schema refresh result:', {
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0
      });
      
      if (error) {
        return NextResponse.json({
          success: false,
          message: 'Schema refresh failed',
          error: error.message,
          code: error.code
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Schema cache refreshed successfully',
        dataCount: data?.length || 0
      });
      
    } catch (dbError) {
      console.error('Refresh Schema GET - Database error:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Database error during schema refresh',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Refresh Schema GET - General error:', error);
    return NextResponse.json({
      success: false,
      message: 'General error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 