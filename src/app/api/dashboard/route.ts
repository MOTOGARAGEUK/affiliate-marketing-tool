import { NextResponse } from 'next/server';
import { dashboardAPI } from '@/lib/dataStore';

export async function GET() {
  try {
    const stats = dashboardAPI.getStats();
    const recentActivity = dashboardAPI.getRecentActivity();
    
    return NextResponse.json({ 
      success: true, 
      stats,
      recentActivity
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 