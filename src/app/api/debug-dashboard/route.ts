import { NextRequest, NextResponse } from 'next/server';
import { dashboardAPI } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params for testing
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    console.log('Debug dashboard for user:', userId);

    // Test current stats
    const currentStats = await dashboardAPI.getStats(userId);
    console.log('Current stats:', currentStats);

    // Test previous month stats
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousStats = await dashboardAPI.getStats(userId, previousMonth);
    console.log('Previous stats:', previousStats);

    // Test chart data
    const chartData = await dashboardAPI.getChartData(userId);
    console.log('Chart data:', chartData);

    // Test recent activity
    const recentActivity = await dashboardAPI.getRecentActivity(userId);
    console.log('Recent activity:', recentActivity);

    return NextResponse.json({
      success: true,
      data: {
        currentStats,
        previousStats,
        chartData,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Debug dashboard error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 