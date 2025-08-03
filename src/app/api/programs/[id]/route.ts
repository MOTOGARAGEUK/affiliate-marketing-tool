import { NextRequest, NextResponse } from 'next/server';
import { programsAPI } from '@/lib/database';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

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
    
    // Prepare program data based on type
    const programData: any = {
      name: body.name,
      type: body.type,
      status: body.status,
      description: body.description
    };

    // Handle different program types
    if (body.type === 'reward') {
      programData.referral_target = body.referralTarget;
      // For reward programs, commission and commission_type should be null
      programData.commission = null;
      programData.commission_type = null;
    } else {
      programData.commission = body.commission;
      programData.commission_type = body.commissionType;
      programData.referral_target = null;
    }
    
    const program = await programsAPI.update(params.id, programData, user.id);
    
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
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create an authenticated client with the user's token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use authenticated client to delete program
    const { error } = await authenticatedSupabase
      .from('programs')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Failed to delete program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete program' },
      { status: 500 }
    );
  }
} 