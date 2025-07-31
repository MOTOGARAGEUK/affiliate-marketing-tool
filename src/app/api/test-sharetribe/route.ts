import { NextRequest, NextResponse } from 'next/server';
import { createSharetribeAPI } from '@/lib/sharetribe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // Create Sharetribe API instance
    const sharetribeAPI = createSharetribeAPI({
      clientId,
      clientSecret,
    });

    // Test the connection
    const isConnected = await sharetribeAPI.testConnection();

    if (isConnected) {
      // Try to get marketplace info to verify the connection
      const marketplaceInfo = await sharetribeAPI.getMarketplaceInfo();
      
      return NextResponse.json({
        success: true,
        message: 'Connection successful! Sharetribe API is working correctly.',
        marketplaceInfo: marketplaceInfo ? {
          name: marketplaceInfo.attributes?.name,
          domain: marketplaceInfo.attributes?.domain,
        } : null,
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to connect to Sharetribe API. Please check your credentials.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Sharetribe API test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Connection failed. Please verify your Client ID and Client Secret are correct.' 
      },
      { status: 500 }
    );
  }
} 