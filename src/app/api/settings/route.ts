import { NextRequest, NextResponse } from 'next/server';
import { integrationsAPI } from '@/lib/database';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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

    const integrations = await integrationsAPI.getAll(user.id);
    
    // Transform integrations to settings format
    const settings = {
      sharetribe: {
        clientId: '',
        clientSecret: '',
        marketplaceUrl: '',
      },
      general: {
        companyName: 'My Affiliate Program',
        defaultCommission: 10,
        currency: 'USD',
        timezone: 'UTC',
        autoApproveReferrals: true,
        minimumPayout: 50,
      }
    };

    // Find Sharetribe integration
    const sharetribeIntegration = integrations.find(integration => integration.type === 'sharetribe');
    if (sharetribeIntegration) {
      settings.sharetribe = {
        clientId: sharetribeIntegration.config.clientId || '',
        clientSecret: sharetribeIntegration.config.clientSecret || '',
        marketplaceUrl: sharetribeIntegration.config.marketplaceUrl || '',
      };
    }

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Failed to load settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { type, settings } = body;

    if (type === 'sharetribe') {
      // Find existing Sharetribe integration or create new one
      const integrations = await integrationsAPI.getAll(user.id);
      const sharetribeIntegration = integrations.find(integration => integration.type === 'sharetribe');
      
      if (sharetribeIntegration) {
        // Update existing integration
        await integrationsAPI.update(sharetribeIntegration.id, {
          config: {
            clientId: settings.clientId,
            clientSecret: settings.clientSecret,
            marketplaceUrl: settings.marketplaceUrl,
          }
        }, user.id);
      } else {
        // Create new integration
        await integrationsAPI.create({
          name: 'Sharetribe Integration',
          type: 'sharetribe',
          status: 'connected',
          config: {
            clientId: settings.clientId,
            clientSecret: settings.clientSecret,
            marketplaceUrl: settings.marketplaceUrl,
          },
          userId: user.id
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 