import { NextRequest, NextResponse } from 'next/server';
import { affiliatesAPI } from '@/lib/database';
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

    const affiliate = await affiliatesAPI.getById(params.id, user.id);
    
    if (affiliate) {
      return NextResponse.json({ success: true, affiliate });
    } else {
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to fetch affiliate:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliate' },
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
    const affiliate = await affiliatesAPI.update(params.id, body, user.id);
    
    if (affiliate) {
      return NextResponse.json({ success: true, affiliate });
    } else {
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to update affiliate:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update affiliate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DELETE AFFILIATE DEBUG ===');
    console.log('Deleting affiliate ID:', params.id);
    
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    try {
      const success = await affiliatesAPI.delete(params.id, user.id);
      console.log('Delete result:', success);
      
      if (success) {
        console.log('✅ Affiliate deleted successfully');
        console.log('=== END DELETE AFFILIATE DEBUG ===');
        return NextResponse.json({ success: true, message: 'Affiliate deleted successfully' });
      } else {
        console.log('❌ Affiliate not found or delete failed');
        console.log('=== END DELETE AFFILIATE DEBUG ===');
        return NextResponse.json(
          { success: false, message: 'Affiliate not found' },
          { status: 404 }
        );
      }
    } catch (deleteError) {
      console.error('❌ Error in affiliatesAPI.delete:', deleteError);
      console.log('=== END DELETE AFFILIATE DEBUG ===');
      return NextResponse.json(
        { success: false, message: 'Failed to delete affiliate', error: deleteError instanceof Error ? deleteError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Failed to delete affiliate:', error);
    console.log('=== END DELETE AFFILIATE DEBUG ===');
    return NextResponse.json(
      { success: false, message: 'Failed to delete affiliate' },
      { status: 500 }
    );
  }
} 