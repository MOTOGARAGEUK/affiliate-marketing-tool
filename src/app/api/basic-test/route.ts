import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Basic test endpoint called');
    
    // Just return success to test if the endpoint works at all
    return NextResponse.json({
      success: true,
      message: '✅ Basic endpoint is working!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Basic test error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: '❌ Basic test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 