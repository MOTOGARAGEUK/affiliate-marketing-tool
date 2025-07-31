import { NextRequest, NextResponse } from 'next/server';
import { affiliatesAPI } from '@/lib/database';
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

    // Use authenticated client to fetch affiliates
    const { data: affiliates, error } = await authenticatedSupabase
      .from('affiliates')
      .select(`
        *,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, affiliates: affiliates || [] });
  } catch (error) {
    console.error('Failed to fetch affiliates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch affiliates' },
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
    
    // Use authenticated client to create affiliate
    const { data: affiliate, error } = await authenticatedSupabase
      .from('affiliates')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        status: body.status,
        program_id: body.programId,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    if (affiliate) {
      return NextResponse.json({ success: true, affiliate });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create affiliate' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to create affiliate:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create affiliate' },
      { status: 500 }
    );
  }
} 