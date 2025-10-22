import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase authentication...');
    
    // Test Supabase connection
    const supabase = createServerClient();
    
    // Test if we can connect to Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase auth error:', error);
      return NextResponse.json({
        success: false,
        message: 'Supabase authentication failed',
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    console.log('✅ Supabase connection successful');
    console.log('📊 Session data:', data);
    
    return NextResponse.json({
      success: true,
      message: '✅ Supabase authentication is working!',
      session: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Supabase test error:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Supabase test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
