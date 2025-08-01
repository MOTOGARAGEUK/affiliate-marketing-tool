import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'API is accessible',
    timestamp: new Date().toISOString(),
    origin: request.headers.get('origin') || 'unknown'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      success: true, 
      message: 'POST request received',
      data: body,
      timestamp: new Date().toISOString(),
      origin: request.headers.get('origin') || 'unknown'
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
} 