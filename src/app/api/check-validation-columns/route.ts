import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    console.log('🔍 Checking if validation columns exist...');

    // Check if columns exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('referrals')
      .select('sharetribe_validation_status, sharetribe_validation_updated_at')
      .limit(1);

    if (testError) {
      console.log('❌ Validation columns do not exist, creating them...');
      
      // Add the columns
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE referrals 
          ADD COLUMN IF NOT EXISTS sharetribe_validation_status VARCHAR(10) CHECK (sharetribe_validation_status IN ('green', 'amber', 'red', 'error')),
          ADD COLUMN IF NOT EXISTS sharetribe_validation_updated_at TIMESTAMP WITH TIME ZONE;
        `
      });

      if (alterError) {
        console.error('❌ Failed to add validation columns:', alterError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to add validation columns',
          error: alterError
        }, { status: 500 });
      }

      console.log('✅ Validation columns added successfully');
      return NextResponse.json({
        success: true,
        message: 'Validation columns created successfully'
      });
    }

    console.log('✅ Validation columns already exist');
    return NextResponse.json({
      success: true,
      message: 'Validation columns already exist'
    });

  } catch (error) {
    console.error('❌ Error checking validation columns:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to check validation columns',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 