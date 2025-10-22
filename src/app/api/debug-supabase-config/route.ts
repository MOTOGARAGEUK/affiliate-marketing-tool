import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    return NextResponse.json({
      success: true,
      siteUrl: siteUrl,
      supabaseUrl: supabaseUrl,
      currentUrl: request.url,
      message: 'Check Supabase project settings for Site URL configuration'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
