import { NextRequest, NextResponse } from 'next/server';
import { integrationsAPI } from '@/lib/database';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
      }
    }

    // If no user is authenticated, return default settings
    if (!user) {
      console.log('Settings GET - No authenticated user, returning defaults');
      return NextResponse.json({
        success: true,
        settings: {
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
        }
      });
    }

    console.log('Settings GET - User ID:', user.id);
    
    let integrations = [];
    try {
      integrations = await integrationsAPI.getAll(user.id);
      console.log('Settings GET - Integrations loaded:', integrations?.length || 0);
    } catch (dbError) {
      console.error('Settings GET - Database error:', dbError);
      throw dbError;
    }
    
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

    // Find General Settings integration
    const generalIntegration = integrations.find(integration => integration.type === 'custom' && integration.name === 'General Settings');
    if (generalIntegration) {
      settings.general = {
        ...settings.general,
        ...generalIntegration.config
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
    console.log('Settings POST - Starting...');
    const supabase = createServerClient();
    
    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    console.log('Settings POST - Auth header:', authHeader ? 'Present' : 'Missing');
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
        console.log('Settings POST - User authenticated:', user.id);
      } else {
        console.log('Settings POST - Auth error:', authError);
      }
    }

    // If no user is authenticated, return error
    if (!user) {
      console.log('Settings POST - No authenticated user, returning 401');
      return NextResponse.json({
        success: false,
        message: 'Authentication required to save settings'
      }, { status: 401 });
    }

    const body = await request.json();
    const { type, settings } = body;
    console.log('Settings POST - Request body:', { type, settings });

    if (type === 'sharetribe') {
      console.log('Settings POST - Processing sharetribe settings');
      // Find existing Sharetribe integration or create new one
      const integrations = await integrationsAPI.getAll(user.id);
      console.log('Settings POST - Found integrations:', integrations?.length || 0);
      const sharetribeIntegration = integrations.find(integration => integration.type === 'sharetribe');
      console.log('Settings POST - Existing sharetribe integration:', !!sharetribeIntegration);
      
      if (sharetribeIntegration) {
        console.log('Settings POST - Updating existing sharetribe integration');
        // Update existing integration
        await integrationsAPI.update(sharetribeIntegration.id, {
          config: {
            clientId: settings.clientId,
            clientSecret: settings.clientSecret,
            marketplaceUrl: settings.marketplaceUrl,
          }
        }, user.id);
        console.log('Settings POST - ShareTribe integration updated successfully');
      } else {
        console.log('Settings POST - Creating new sharetribe integration');
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
        console.log('Settings POST - ShareTribe integration created successfully');
      }
    } else if (type === 'general') {
      console.log('Settings POST - Processing general settings');
      // Save general settings to a general settings integration
      const integrations = await integrationsAPI.getAll(user.id);
      console.log('Settings POST - Found integrations for general:', integrations?.length || 0);
      const generalIntegration = integrations.find(integration => integration.type === 'custom' && integration.name === 'General Settings');
      console.log('Settings POST - Existing general integration:', !!generalIntegration);
      
      if (generalIntegration) {
        console.log('Settings POST - Updating existing general integration');
        // Update existing general settings
        await integrationsAPI.update(generalIntegration.id, {
          config: settings
        }, user.id);
        console.log('Settings POST - General integration updated successfully');
      } else {
        console.log('Settings POST - Creating new general integration');
        // Create new general settings
        await integrationsAPI.create({
          name: 'General Settings',
          type: 'custom',
          status: 'connected',
          config: settings,
          userId: user.id
        });
        console.log('Settings POST - General integration created successfully');
      }
    }

    // Return updated settings
    console.log('Settings POST - Fetching updated integrations...');
    const updatedIntegrations = await integrationsAPI.getAll(user.id);
    console.log('Settings POST - Updated integrations count:', updatedIntegrations?.length || 0);
    
    // Transform integrations to settings format
    const updatedSettings = {
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
    const sharetribeIntegration = updatedIntegrations.find(integration => integration.type === 'sharetribe');
    if (sharetribeIntegration) {
      updatedSettings.sharetribe = {
        clientId: sharetribeIntegration.config.clientId || '',
        clientSecret: sharetribeIntegration.config.clientSecret || '',
        marketplaceUrl: sharetribeIntegration.config.marketplaceUrl || '',
      };
    }

    // Find General Settings integration
    const generalIntegration = updatedIntegrations.find(integration => integration.type === 'custom' && integration.name === 'General Settings');
    if (generalIntegration) {
      updatedSettings.general = {
        ...updatedSettings.general,
        ...generalIntegration.config
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to save settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 