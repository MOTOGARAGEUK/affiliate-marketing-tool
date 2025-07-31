import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Test UTM Table - Starting...');
    const supabase = createServerClient();
    
    // Test if we can connect to the database
    console.log('Test UTM Table - Testing database connection...');
    
    // Check if utm_tracking table exists
    try {
      const { data: utmData, error: utmError } = await supabase
        .from('utm_tracking')
        .select('*')
        .limit(1);
      
      console.log('Test UTM Table - UTM tracking table test:', {
        success: !utmError,
        error: utmError?.message,
        dataCount: utmData?.length || 0
      });
      
      if (utmError) {
        return NextResponse.json({
          success: false,
          message: 'UTM tracking table error',
          error: utmError.message,
          code: utmError.code
        }, { status: 500 });
      }
      
      // Check table structure by trying to select specific columns
      const { data: structureTest, error: structureError } = await supabase
        .from('utm_tracking')
        .select('id, user_pseudo_id, utm_source, utm_medium, utm_campaign, event_name, event_timestamp, user_email, user_name, processed, sharetribe_user_id, created_at, updated_at')
        .limit(1);
      
      console.log('Test UTM Table - Structure test:', {
        success: !structureError,
        error: structureError?.message,
        columns: structureTest ? Object.keys(structureTest[0] || {}) : []
      });
      
      if (structureError) {
        return NextResponse.json({
          success: false,
          message: 'Structure test error',
          error: structureError.message,
          code: structureError.code
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'UTM tracking table exists and is accessible',
        utmCount: utmData?.length || 0,
        columns: structureTest ? Object.keys(structureTest[0] || {}) : [],
        tableExists: true
      });
      
    } catch (dbError) {
      console.error('Test UTM Table - Database error:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Database connection error',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test UTM Table - General error:', error);
    return NextResponse.json({
      success: false,
      message: 'General error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 