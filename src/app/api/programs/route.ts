import { NextRequest, NextResponse } from 'next/server';
import { programsAPI } from '@/lib/database';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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

    // Use authenticated client to fetch programs
    const { data: programs, error } = await authenticatedSupabase
      .from('programs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, programs: programs || [] });
  } catch (error) {
    console.error('Failed to fetch programs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Prepare program data based on type
    const programData: any = {
      name: body.name,
      type: body.type,
      status: body.status,
      description: body.description,
      user_id: user.id
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
    
    // Use authenticated client to create program
    const { data: program, error } = await authenticatedSupabase
      .from('programs')
      .insert(programData)
      .select()
      .single();
    
    if (error) throw error;
    
    if (program) {
      return NextResponse.json({ success: true, program });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create program' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to create program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create program' },
      { status: 500 }
    );
  }
} 