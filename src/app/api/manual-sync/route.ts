import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== MANUAL SYNC TRIGGERED ===');
    
    // Call the sync endpoint
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/sync-sharetribe-referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        syncType: 'all'
      })
    });
    
    const result = await response.json();
    
    console.log('Manual sync result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Manual sync completed',
      result
    });
    
  } catch (error) {
    console.error('❌ Manual sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to trigger manual sync',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 