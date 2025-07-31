import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketplaceId, clientId, clientSecret, apiUrl, accessToken, apiType, userId } = body;
    
    if (!marketplaceId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate based on API type
    if (apiType === 'marketplace') {
      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { success: false, message: 'Client ID and Client Secret are required for Marketplace API' },
          { status: 400 }
        );
      }
    } else if (apiType === 'integration') {
      if (!apiUrl || !accessToken) {
        return NextResponse.json(
          { success: false, message: 'API URL and Access Token are required for Integration API' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid API type. Must be "marketplace" or "integration"' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Prepare config based on API type
    const config = {
      marketplaceId,
      apiType,
      ...(apiType === 'marketplace' ? {
        clientId,
        clientSecret
      } : {
        apiUrl,
        accessToken
      })
    };
    
    // Save or update Sharetribe integration settings
    const { data, error } = await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        type: 'sharetribe',
        name: `${marketplaceId} Marketplace (${apiType === 'marketplace' ? 'Marketplace API' : 'Integration API'})`,
        config,
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
          apiType: data.config.apiType,
          // Don't return sensitive credentials for security
          ...(data.config.apiType === 'marketplace' ? {
            clientId: data.config.clientId
          } : {
            apiUrl: data.config.apiUrl
          })
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