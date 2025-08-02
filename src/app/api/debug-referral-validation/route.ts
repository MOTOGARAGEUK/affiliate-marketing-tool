import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralId, userEmail } = body;

    console.log('🔍 Debug referral validation for:', { referralId, userEmail });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the referral details
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select(`
        *,
        affiliates (
          id,
          user_id,
          name,
          referral_code
        )
      `)
      .eq('id', referralId)
      .single();

    if (referralError || !referral) {
      console.log('❌ Referral not found:', referralId);
      return NextResponse.json({ success: false, message: 'Referral not found' });
    }

    console.log('✅ Found referral:', {
      id: referral.id,
      affiliateName: referral.affiliates?.name,
      affiliateUserId: referral.affiliates?.user_id,
      customerEmail: referral.customer_email
    });

    // Get ShareTribe credentials
    const { getSharetribeCredentials } = await import('@/lib/sharetribe');
    const credentials = await getSharetribeCredentials(referral.affiliates?.user_id);

    console.log('🔍 ShareTribe credentials found:', !!credentials);
    if (credentials) {
      console.log('🔍 Using clientId:', credentials.clientId ? 'SET' : 'NOT SET');
      console.log('🔍 Using clientSecret:', credentials.clientSecret ? 'SET' : 'NOT SET');
      console.log('🔍 Using marketplaceUrl:', credentials.marketplaceUrl || 'NOT SET');
    } else {
      console.log('❌ No ShareTribe credentials found');
      return NextResponse.json({ 
        success: false, 
        message: 'No ShareTribe credentials found',
        debug: {
          affiliateUserId: referral.affiliates?.user_id,
          credentialsFound: false
        }
      });
    }

    // Test ShareTribe API connection
    const { createSharetribeAPI } = await import('@/lib/sharetribe');
    const sharetribeAPI = createSharetribeAPI(credentials);

    console.log('🔍 Testing ShareTribe connection...');
    const connectionTest = await sharetribeAPI.testConnection();
    console.log('🔍 ShareTribe connection test result:', connectionTest);

    if (!connectionTest) {
      return NextResponse.json({ 
        success: false, 
        message: 'ShareTribe connection failed',
        debug: {
          credentialsFound: true,
          connectionTest: false
        }
      });
    }

    // Test getting user by email
    console.log('🔍 Looking for user in ShareTribe:', userEmail);
    const sharetribeUser = await sharetribeAPI.getUserByEmail(userEmail);

    if (sharetribeUser) {
      console.log('✅ User found in ShareTribe:', {
        id: sharetribeUser.id,
        email: sharetribeUser.email,
        emailVerified: sharetribeUser.attributes?.emailVerified,
        createdAt: sharetribeUser.createdAt
      });

      // Determine validation status
      let validationStatus = 'red';
      if (sharetribeUser.attributes?.emailVerified === true) {
        validationStatus = 'green';
      } else if (sharetribeUser.attributes?.emailVerified === false) {
        validationStatus = 'amber';
      }

      console.log('🔍 Validation status:', validationStatus);

      // Update referral with ShareTribe data
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          sharetribe_user_id: sharetribeUser.id,
          sharetribe_created_at: sharetribeUser.createdAt,
          sharetribe_validation_status: validationStatus,
          sharetribe_validation_updated_at: new Date().toISOString()
        })
        .eq('id', referralId);

      if (updateError) {
        console.error('❌ Error updating referral:', updateError);
        return NextResponse.json({ 
          success: false, 
          message: 'Error updating referral',
          debug: {
            userFound: true,
            updateError: updateError
          }
        });
      }

      console.log('✅ Referral updated successfully');

      return NextResponse.json({ 
        success: true, 
        message: 'User found and referral updated',
        debug: {
          userFound: true,
          userId: sharetribeUser.id,
          validationStatus: validationStatus,
          createdAt: sharetribeUser.createdAt,
          emailVerified: sharetribeUser.attributes?.emailVerified
        }
      });

    } else {
      console.log('❌ User not found in ShareTribe');

      // Update referral to mark as invalid
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          sharetribe_validation_status: 'red',
          sharetribe_validation_updated_at: new Date().toISOString()
        })
        .eq('id', referralId);

      if (updateError) {
        console.error('❌ Error updating referral status:', updateError);
      }

      return NextResponse.json({ 
        success: false, 
        message: 'User not found in ShareTribe',
        debug: {
          userFound: false,
          emailSearched: userEmail
        }
      });
    }

  } catch (error) {
    console.error('❌ Debug validation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Debug validation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 