import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('Test Programs POST - Starting...');
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Test Programs POST - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Test Programs POST - Token length:', token.length);
    
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
    
    console.log('Test Programs POST - Authenticated client created');
    
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Test Programs POST - Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Test Programs POST - User authenticated:', user.id);

    const body = await request.json();
    console.log('Test Programs POST - Request body:', body);
    
    // Test the insert operation
    const { data: program, error } = await authenticatedSupabase
      .from('programs')
      .insert({
        name: body.name || 'Test Program',
        type: body.type || 'signup',
        commission: body.commission || 10,
        commission_type: body.commissionType || 'fixed',
        status: body.status || 'active',
        description: body.description || 'Test description',
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) {
      console.log('Test Programs POST - Database error:', error);
      throw error;
    }
    
    console.log('Test Programs POST - Program created successfully:', program);
    
    return NextResponse.json({ 
      success: true, 
      program,
      message: 'Test program created successfully'
    });
    
  } catch (error) {
    console.error('Test Programs POST - Failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create test program',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 