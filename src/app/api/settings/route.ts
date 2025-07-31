import { NextRequest, NextResponse } from 'next/server';

// In a real app, this would be stored in a database
// For now, we'll use a simple in-memory store (will reset on server restart)
let settingsStore = {
  sharetribe: {
    clientId: '',
    clientSecret: '',
    marketplaceUrl: '',
  },
  general: {
    companyName: 'My Affiliate Program',
    defaultCommission: 10,
    currency: 'USD',
    timezone: 'UTC',
    autoApproveReferrals: true,
    minimumPayout: 50,
  }
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      settings: settingsStore
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, settings } = body;

    if (type === 'sharetribe') {
      settingsStore.sharetribe = {
        ...settingsStore.sharetribe,
        ...settings
      };
    } else if (type === 'general') {
      settingsStore.general = {
        ...settingsStore.general,
        ...settings
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: settingsStore
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 