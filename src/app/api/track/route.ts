import { NextRequest, NextResponse } from 'next/server';
import { mockAffiliates, mockReferrals } from '@/lib/mockData';
import { generateId } from '@/lib/utils';
import { createSharetribeAPI } from '@/lib/sharetribe';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref');
  const type = searchParams.get('type') || 'signup';
  const customerEmail = searchParams.get('email');
  const amount = searchParams.get('amount');

  if (!ref) {
    return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });
  }

  // Find affiliate by referral code
  const affiliate = mockAffiliates.find(a => a.referralCode === ref);
  if (!affiliate) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  // Create referral record
  const referral = {
    id: generateId(),
    affiliateId: affiliate.id,
    programId: type === 'signup' ? '1' : '2', // Default program IDs
    customerEmail: customerEmail || 'unknown@example.com',
    amount: amount ? parseFloat(amount) : undefined,
    commission: type === 'signup' ? 10 : (amount ? parseFloat(amount) * 0.15 : 0),
    status: 'pending',
    type: type as 'signup' | 'purchase',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // In a real app, you would save this to a database
  console.log('New referral tracked:', referral);

  // Redirect to the main marketplace or return success
  const redirectUrl = process.env.MARKETPLACE_URL || 'https://marketplace.com';
  
  return NextResponse.redirect(`${redirectUrl}?ref=${ref}&tracked=true`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ref, type, customerEmail, amount, sharetribeConfig } = body;

    if (!ref) {
      return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });
    }

    // Find affiliate by referral code
    const affiliate = mockAffiliates.find(a => a.referralCode === ref);
    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // If Sharetribe config is provided, verify the user exists
    if (sharetribeConfig && customerEmail) {
      try {
        const sharetribeAPI = createSharetribeAPI(sharetribeConfig);
        const user = await sharetribeAPI.getUserByEmail(customerEmail);
        
        if (!user) {
          return NextResponse.json({ 
            error: 'User not found in Sharetribe marketplace',
            message: 'Please ensure the user has signed up in your marketplace first.'
          }, { status: 404 });
        }
      } catch (error) {
        console.error('Sharetribe API error:', error);
        return NextResponse.json({ 
          error: 'Failed to verify user with Sharetribe',
          message: 'Please check your Sharetribe API configuration.'
        }, { status: 500 });
      }
    }

    // Create referral record
    const referral = {
      id: generateId(),
      affiliateId: affiliate.id,
      programId: type === 'signup' ? '1' : '2',
      customerEmail: customerEmail || 'unknown@example.com',
      amount: amount ? parseFloat(amount) : undefined,
      commission: type === 'signup' ? 10 : (amount ? parseFloat(amount) * 0.15 : 0),
      status: 'pending',
      type: type as 'signup' | 'purchase',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real app, you would save this to a database
    console.log('New referral tracked:', referral);

    return NextResponse.json({ 
      success: true, 
      referral,
      message: 'Referral tracked successfully' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
