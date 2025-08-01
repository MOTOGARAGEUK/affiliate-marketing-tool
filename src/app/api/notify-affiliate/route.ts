import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== AFFILIATE NOTIFICATION ===');
    
    const body = await request.json();
    const { 
      affiliateId, 
      referralId, 
      customerEmail, 
      customerName,
      commissionEarned = 0,
      notificationType = 'new_referral' // 'new_referral', 'purchase', 'commission_paid'
    } = body;
    
    if (!affiliateId || !referralId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get affiliate information
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, name, email, user_id')
      .eq('id', affiliateId)
      .single();
    
    if (affiliateError || !affiliate) {
      console.log('❌ Affiliate not found:', affiliateId);
      return NextResponse.json(
        { success: false, message: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found affiliate:', affiliate.name);
    
    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from('affiliate_notifications')
      .insert({
        affiliate_id: affiliateId,
        referral_id: referralId,
        notification_type: notificationType,
        title: getNotificationTitle(notificationType),
        message: getNotificationMessage(notificationType, customerName, commissionEarned),
        customer_email: customerEmail,
        customer_name: customerName,
        commission_earned: commissionEarned,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (notificationError) {
      console.error('❌ Error creating notification:', notificationError);
      return NextResponse.json(
        { success: false, message: 'Error creating notification' },
        { status: 500 }
      );
    }
    
    console.log('✅ Notification created:', notification.id);
    
    // Send email notification (if configured)
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      try {
        await sendEmailNotification(affiliate, notification);
        console.log('✅ Email notification sent');
      } catch (emailError) {
        console.error('❌ Email notification failed:', emailError);
        // Don't fail the whole request if email fails
      }
    }
    
    // Send webhook notification (if configured)
    if (process.env.AFFILIATE_WEBHOOK_URL) {
      try {
        await sendWebhookNotification(affiliate, notification);
        console.log('✅ Webhook notification sent');
      } catch (webhookError) {
        console.error('❌ Webhook notification failed:', webhookError);
        // Don't fail the whole request if webhook fails
      }
    }
    
    console.log('=== END AFFILIATE NOTIFICATION ===');
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notification: {
        id: notification.id,
        type: notification.notification_type,
        title: notification.title
      }
    });
    
  } catch (error) {
    console.error('❌ Affiliate notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Notification failed' },
      { status: 500 }
    );
  }
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case 'new_referral':
      return '🎉 New Referral Signup!';
    case 'purchase':
      return '💰 Referral Made a Purchase!';
    case 'commission_paid':
      return '💳 Commission Paid!';
    default:
      return '📢 New Notification';
  }
}

function getNotificationMessage(type: string, customerName: string, commissionEarned: number): string {
  switch (type) {
    case 'new_referral':
      return `${customerName} signed up using your referral link! They're now a member of our marketplace.`;
    case 'purchase':
      return `${customerName} made a purchase! You've earned £${commissionEarned.toFixed(2)} in commission.`;
    case 'commission_paid':
      return `Your commission of £${commissionEarned.toFixed(2)} has been paid out!`;
    default:
      return 'You have a new notification from your affiliate dashboard.';
  }
}

async function sendEmailNotification(affiliate: any, notification: any) {
  // This would integrate with your email service (SendGrid, Mailgun, etc.)
  // For now, we'll just log the email details
  console.log('📧 Email notification would be sent to:', affiliate.email);
  console.log('📧 Subject:', notification.title);
  console.log('📧 Message:', notification.message);
  
  // Example with a hypothetical email service:
  /*
  const emailService = new EmailService();
  await emailService.send({
    to: affiliate.email,
    subject: notification.title,
    html: `
      <h2>${notification.title}</h2>
      <p>${notification.message}</p>
      <p>Login to your <a href="${process.env.APP_URL}/dashboard">affiliate dashboard</a> to view details.</p>
    `
  });
  */
}

async function sendWebhookNotification(affiliate: any, notification: any) {
  const webhookUrl = process.env.AFFILIATE_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return;
  }
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Affiliate-ID': affiliate.id,
      'X-Notification-Type': notification.notification_type
    },
    body: JSON.stringify({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email
      },
      notification: {
        id: notification.id,
        type: notification.notification_type,
        title: notification.title,
        message: notification.message,
        customerEmail: notification.customer_email,
        customerName: notification.customer_name,
        commissionEarned: notification.commission_earned,
        createdAt: notification.created_at
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }
} 