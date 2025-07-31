import { NextRequest, NextResponse } from 'next/server';
import { programsAPI } from '@/lib/dataStore';

export async function GET() {
  try {
    const programs = programsAPI.getAll();
    return NextResponse.json({ success: true, programs });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const program = programsAPI.create(body);
    
    if (program) {
      return NextResponse.json({ success: true, program });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create program' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create program' },
      { status: 500 }
    );
  }
} 