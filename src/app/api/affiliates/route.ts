import { NextRequest, NextResponse } from 'next/server';
import { affiliatesAPI } from '@/lib/dataStore';

export async function GET() {
  try {
    const affiliates = affiliatesAPI.getAll();
    return NextResponse.json({ success: true, affiliates });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const affiliate = affiliatesAPI.create(body);
    
    if (affiliate) {
      return NextResponse.json({ success: true, affiliate });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create affiliate' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create affiliate' },
      { status: 500 }
    );
  }
} 