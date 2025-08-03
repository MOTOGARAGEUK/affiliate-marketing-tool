import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create an authenticated client with the user's token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the referral_target column exists
    try {
      const { data, error } = await authenticatedSupabase
        .from('programs')
        .select('referral_target')
        .limit(1);
      
      if (error) {
        // If we get an error about the column not existing, the migration hasn't been run
        if (error.message.includes('referral_target') || error.message.includes('column')) {
          return NextResponse.json({
            success: false,
            migrationNeeded: true,
            message: 'Database migration required for reward programs. Please run the migration script: add-reward-programs-support.sql'
          });
        }
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        migrationNeeded: false,
        message: 'Reward programs migration has been completed'
      });
    } catch (dbError: any) {
      console.error('Database check error:', dbError);
      
      // Check if it's a column not found error
      if (dbError.message && (
        dbError.message.includes('referral_target') || 
        dbError.message.includes('column') ||
        dbError.message.includes('does not exist')
      )) {
        return NextResponse.json({
          success: false,
          migrationNeeded: true,
          message: 'Database migration required for reward programs. Please run the migration script: add-reward-programs-support.sql'
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check migration status' },
      { status: 500 }
    );
  }
} 