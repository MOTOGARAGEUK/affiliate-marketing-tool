import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Test Schema GET - Starting...');
    const supabase = createServerClient();
    
    // Test if we can connect to the database
    console.log('Test Schema GET - Testing database connection...');
    
    // Check if integrations table exists
    try {
      const { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('*')
        .limit(1);
      
      console.log('Test Schema GET - Integrations table test:', {
        success: !integrationsError,
        error: integrationsError?.message,
        dataCount: integrations?.length || 0
      });
      
      if (integrationsError) {
        return NextResponse.json({
          success: false,
          message: 'Integrations table error',
          error: integrationsError.message,
          code: integrationsError.code
        }, { status: 500 });
      }
      
      // Check table structure by trying to select specific columns
      const { data: structureTest, error: structureError } = await supabase
        .from('integrations')
        .select('id, name, type, status, config, user_id, created_at, updated_at')
        .limit(1);
      
      console.log('Test Schema GET - Structure test:', {
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
        message: 'Database schema is correct',
        integrationsCount: integrations?.length || 0,
        columns: structureTest ? Object.keys(structureTest[0] || {}) : []
      });
      
    } catch (dbError) {
      console.error('Test Schema GET - Database error:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Database connection error',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test Schema GET - General error:', error);
    return NextResponse.json({
      success: false,
      message: 'General error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 