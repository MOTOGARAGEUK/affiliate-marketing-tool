import { NextRequest, NextResponse } from 'next/server';
import { integrationsAPI } from '@/lib/database';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Test Settings GET - Starting...');
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Test Settings GET - Auth header:', authHeader ? 'Present' : 'Missing');
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
        console.log('Test Settings GET - User authenticated:', user.id);
      } else {
        console.log('Test Settings GET - Auth error:', authError);
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Test database operations
    console.log('Test Settings GET - Testing database operations...');
    
    try {
      const integrations = await integrationsAPI.getAll(user.id);
      console.log('Test Settings GET - Database test successful, integrations count:', integrations?.length || 0);
      
      return NextResponse.json({
        success: true,
        message: 'Database operations working',
        integrationsCount: integrations?.length || 0
      });
    } catch (dbError) {
      console.error('Test Settings GET - Database error:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Database error',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test Settings GET - General error:', error);
    return NextResponse.json({
      success: false,
      message: 'General error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 