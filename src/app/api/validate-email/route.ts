import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email already exists for this user
    const { data: existingAffiliate, error: checkError } = await authenticatedSupabase
      .from('affiliates')
      .select('id, name, email')
      .eq('user_id', user.id)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing affiliate:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking email availability' },
        { status: 500 }
      );
    }

    if (existingAffiliate) {
      return NextResponse.json(
        { success: false, message: 'This email is already in use' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email is available' 
    });
  } catch (error) {
    console.error('Failed to validate email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to validate email' },
      { status: 500 }
    );
  }
} 