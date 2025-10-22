import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('📊 Supabase URL:', supabaseUrl);
    console.log('🔑 Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey
      }, { status: 500 });
    }
    
    // Test if the URL is reachable
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      console.log('🌐 Supabase response status:', response.status);
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: '✅ Supabase connection successful!',
          supabaseUrl: supabaseUrl,
          status: response.status
        });
      } else {
        return NextResponse.json({
          success: false,
          message: '❌ Supabase connection failed',
          status: response.status,
          statusText: response.statusText
        }, { status: 500 });
      }
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return NextResponse.json({
        success: false,
        message: '❌ Supabase URL not reachable',
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        supabaseUrl: supabaseUrl
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
