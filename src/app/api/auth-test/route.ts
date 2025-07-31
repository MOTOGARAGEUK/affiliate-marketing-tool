import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check if authorization header is present
    const authHeader = request.headers.get('authorization');
    console.log('Auth test - Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      console.log('Auth test - Token length:', token.length);
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.log('Auth test - Token validation error:', error.message);
        return NextResponse.json({
          success: false,
          message: 'Token validation failed',
          error: error.message
        });
      }
      
      if (user) {
        console.log('Auth test - User authenticated:', user.email);
        return NextResponse.json({
          success: true,
          message: 'User authenticated',
          user: {
            id: user.id,
            email: user.email
          }
        });
      } else {
        console.log('Auth test - No user found');
        return NextResponse.json({
          success: false,
          message: 'No user found'
        });
      }
    } else {
      console.log('Auth test - No authorization header');
      return NextResponse.json({
        success: false,
        message: 'No authorization header'
      });
    }
    
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Auth test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 