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
    const { fixType } = body;

    if (fixType === 'duplicate-affiliates') {
      // Fix duplicate affiliates
      console.log('🔧 Fixing duplicate affiliates...');
      
      // First, get all affiliates for this user
      const { data: allAffiliates, error: fetchError } = await authenticatedSupabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching affiliates:', fetchError);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch affiliates' },
          { status: 500 }
        );
      }

      if (!allAffiliates || allAffiliates.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No affiliates found to fix',
          fixed: 0,
          total: 0
        });
      }

      // Group affiliates by email (case-insensitive)
      const emailGroups = new Map<string, any[]>();
      allAffiliates.forEach(affiliate => {
        const emailKey = affiliate.email.toLowerCase().trim();
        if (!emailGroups.has(emailKey)) {
          emailGroups.set(emailKey, []);
        }
        emailGroups.get(emailKey)!.push(affiliate);
      });

      // Find duplicates and keep only the latest one
      let duplicatesRemoved = 0;
      const affiliatesToKeep: any[] = [];
      const affiliatesToDelete: string[] = [];

      emailGroups.forEach((affiliates, email) => {
        if (affiliates.length > 1) {
          // Sort by created_at descending and keep the latest
          affiliates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const latestAffiliate = affiliates[0];
          const duplicates = affiliates.slice(1);
          
          affiliatesToKeep.push(latestAffiliate);
          duplicates.forEach(duplicate => {
            affiliatesToDelete.push(duplicate.id);
            duplicatesRemoved++;
          });
          
          console.log(`📧 Email ${email}: Keeping ${latestAffiliate.name} (${latestAffiliate.id}), removing ${duplicates.length} duplicates`);
        } else {
          affiliatesToKeep.push(affiliates[0]);
        }
      });

      // Delete duplicate affiliates
      if (affiliatesToDelete.length > 0) {
        const { error: deleteError } = await authenticatedSupabase
          .from('affiliates')
          .delete()
          .in('id', affiliatesToDelete);

        if (deleteError) {
          console.error('Error deleting duplicate affiliates:', deleteError);
          return NextResponse.json(
            { success: false, message: 'Failed to delete duplicate affiliates' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `Duplicate affiliates fixed. ${duplicatesRemoved} duplicates removed, ${affiliatesToKeep.length} affiliates kept.`,
        duplicatesRemoved,
        affiliatesKept: affiliatesToKeep.length,
        total: allAffiliates.length
      });

    } else if (fixType === 'missing-validation-status') {
      // Fix missing validation status
      console.log('🔧 Fixing missing validation status...');
      
      const { data: referrals, error: fetchError } = await authenticatedSupabase
        .from('referrals')
        .select('id, customer_email, sharetribe_validation_status')
        .eq('user_id', user.id)
        .is('sharetribe_validation_status', null);

      if (fetchError) {
        console.error('Error fetching referrals:', fetchError);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch referrals' },
          { status: 500 }
        );
      }

      if (!referrals || referrals.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No referrals found with missing validation status',
          fixed: 0,
          total: 0
        });
      }

      // Update referrals with default validation status
      const { error: updateError } = await authenticatedSupabase
        .from('referrals')
        .update({
          sharetribe_validation_status: 'amber',
          sharetribe_validation_updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .is('sharetribe_validation_status', null);

      if (updateError) {
        console.error('Error updating referrals:', updateError);
        return NextResponse.json(
          { success: false, message: 'Failed to update referrals' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Missing validation status fixed. ${referrals.length} referrals updated with 'amber' status.`,
        fixed: referrals.length,
        total: referrals.length
      });

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid fix type. Use "duplicate-affiliates" or "missing-validation-status"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Failed to fix database issues:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fix database issues' },
      { status: 500 }
    );
  }
} 