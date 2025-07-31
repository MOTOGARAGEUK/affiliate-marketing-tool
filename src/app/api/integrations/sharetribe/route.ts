import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketplaceId, clientId, clientSecret, userId } = body;
    
    if (!marketplaceId || !clientId || !clientSecret || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Save or update Sharetribe integration settings
    const { data, error } = await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        type: 'sharetribe',
        name: `${marketplaceId} Marketplace`,
        config: {
          marketplaceId,
          clientId,
          clientSecret
        },
        status: 'connected',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,type'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving Sharetribe integration:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to save integration' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sharetribe integration saved successfully',
      integration: {
        id: data.id,
        type: data.type,
        name: data.name,
        status: data.status,
        config: {
          marketplaceId: data.config.marketplaceId,
          clientId: data.config.clientId,
          // Don't return client secret for security
        }
      }
    });
    
  } catch (error) {
    console.error('Sharetribe integration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get Sharetribe integration settings
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'sharetribe')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Sharetribe integration:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch integration' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json({
        success: true,
        integration: null
      });
    }
    
    return NextResponse.json({
      success: true,
      integration: {
        id: data.id,
        type: data.type,
        name: data.name,
        status: data.status,
        config: {
          marketplaceId: data.config.marketplaceId,
          clientId: data.config.clientId,
          // Don't return client secret for security
        }
      }
    });
    
  } catch (error) {
    console.error('Sharetribe integration fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 