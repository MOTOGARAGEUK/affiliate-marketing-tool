import { NextRequest, NextResponse } from 'next/server';
import { programsAPI } from '@/lib/database';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const program = await programsAPI.getById(params.id, user.id);
    
    if (program) {
      return NextResponse.json({ success: true, program });
    } else {
      return NextResponse.json(
        { success: false, message: 'Program not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to fetch program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const program = await programsAPI.update(params.id, body, user.id);
    
    if (program) {
      return NextResponse.json({ success: true, program });
    } else {
      return NextResponse.json(
        { success: false, message: 'Program not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to update program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update program' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const success = await programsAPI.delete(params.id, user.id);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Program deleted successfully' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Program not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to delete program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete program' },
      { status: 500 }
    );
  }
} 