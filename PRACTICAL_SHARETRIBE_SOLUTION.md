# Practical Sharetribe UTM Tracking Solution

## 🎯 **Problem Statement**
- ❌ Cannot set up webhooks in Sharetribe
- ❌ Cannot add custom JavaScript to Sharetribe pages
- ✅ Need to track affiliate referrals with UTM parameters

## 🚀 **Recommended Solution: External Automation**

Since direct integration isn't possible, we'll use **external automation tools** to bridge the gap.

## 📋 **Step-by-Step Implementation**

### **Step 1: Set Up Your Tracking API**

Your affiliate app already has a powerful tracking API endpoint:

```
POST https://your-app.vercel.app/api/ga-measurement-protocol
```

**Required payload:**
```json
{
  "eventName": "sign_up",
  "userEmail": "user@example.com", 
  "userName": "User Name",
  "utmSource": "affiliate",
  "utmMedium": "referral",
  "utmCampaign": "AFFILIATE_CODE"
}
```

### **Step 2: Choose Your Automation Tool**

#### **Option A: Zapier (Recommended)**
- **Cost**: Free tier available
- **Ease**: Very user-friendly
- **Integration**: Excellent with Sharetribe API

#### **Option B: Make.com (Integromat)**
- **Cost**: Free tier available  
- **Power**: More advanced automation
- **Learning curve**: Slightly steeper

#### **Option C: n8n.io**
- **Cost**: Self-hosted (free)
- **Power**: Very flexible
- **Setup**: Requires technical knowledge

### **Step 3: Zapier Implementation (Step-by-Step)**

#### **3.1 Create Zapier Account**
1. Go to [zapier.com](https://zapier.com)
2. Sign up for free account
3. Create your first "Zap"

#### **3.2 Set Up Trigger**
1. **Choose Trigger App**: Search for "Sharetribe"
2. **Choose Event**: "New User" or "User Created"
3. **Connect Account**: Add your Sharetribe API credentials
4. **Test Trigger**: Create a test user to verify

#### **3.3 Set Up Action**
1. **Choose Action App**: "Webhooks by Zapier"
2. **Choose Event**: "POST"
3. **Configure Webhook**:
   - **URL**: `https://your-app.vercel.app/api/ga-measurement-protocol`
   - **Method**: POST
   - **Data**: 
     ```json
     {
       "eventName": "sign_up",
       "userEmail": "{{user.email}}",
       "userName": "{{user.name}}",
       "utmSource": "affiliate",
       "utmMedium": "referral",
       "utmCampaign": "AFFILIATE_CODE"
     }
     ```

#### **3.4 Test and Activate**
1. **Test the Zap**: Create a test user
2. **Check your affiliate app**: Verify referral appears
3. **Activate the Zap**: Turn on automation

### **Step 4: Alternative - Email-Based Tracking**

If API integration isn't working, use email monitoring:

#### **4.1 Set Up Email Trigger**
1. **Choose Trigger**: "Gmail" or "Email Parser"
2. **Filter**: Emails from Sharetribe containing "signup" or "welcome"
3. **Extract Data**: Parse user email and name

#### **4.2 Set Up Action**
1. **Webhook Action**: Same as above
2. **Data Mapping**: Map parsed email data to API payload

### **Step 5: UTM Parameter Handling**

Since you can't capture UTM parameters directly, use these strategies:

#### **5.1 Affiliate Code in Campaign**
Use the affiliate's referral code as the UTM campaign:
```
https://your-marketplace.sharetribe.com/?utm_campaign=AFFILIATE_CODE
```

#### **5.2 Manual UTM Assignment**
In your automation, assign UTM parameters based on:
- **Source**: Always "affiliate"
- **Medium**: Always "referral" 
- **Campaign**: Use affiliate's referral code

#### **5.3 Dynamic Campaign Mapping**
Create a mapping table in your automation:
- Affiliate A → Campaign: "AFFILIATE_A"
- Affiliate B → Campaign: "AFFILIATE_B"

## 🔧 **Advanced Implementation**

### **Multiple Affiliate Tracking**

If you have multiple affiliates, create separate Zaps:

1. **Zap 1**: Affiliate A referrals
2. **Zap 2**: Affiliate B referrals
3. **Zap 3**: Affiliate C referrals

Or use a single Zap with conditional logic.

### **Purchase Tracking**

Add a second Zap for purchase events:

```json
{
  "eventName": "purchase",
  "userEmail": "{{user.email}}",
  "transactionId": "{{transaction.id}}",
  "value": "{{transaction.amount}}",
  "utmSource": "affiliate",
  "utmMedium": "referral", 
  "utmCampaign": "AFFILIATE_CODE"
}
```

## 🧪 **Testing Your Setup**

### **Test 1: Manual API Call**
```bash
curl -X POST https://your-app.vercel.app/api/ga-measurement-protocol \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "sign_up",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "utmSource": "affiliate",
    "utmMedium": "referral",
    "utmCampaign": "TEST_AFFILIATE"
  }'
```

### **Test 2: Check Dashboard**
1. Go to your affiliate app dashboard
2. Navigate to **Referrals** tab
3. Look for the test referral

### **Test 3: Automation Test**
1. Create a test user in Sharetribe
2. Check Zapier logs for trigger/action
3. Verify referral appears in dashboard

## 📊 **Monitoring and Maintenance**

### **Daily Checks**
- Monitor Zapier task usage (free tier limits)
- Check for failed webhook calls
- Verify new referrals are appearing

### **Weekly Checks**
- Review affiliate performance
- Check commission calculations
- Monitor automation reliability

### **Monthly Checks**
- Analyze referral patterns
- Optimize automation workflows
- Review and update affiliate codes

## 🚨 **Troubleshooting**

### **Issue: No referrals appearing**
**Solutions:**
1. Check Zapier webhook logs
2. Verify API endpoint is working
3. Test with manual API call
4. Check affiliate referral codes

### **Issue: Duplicate referrals**
**Solutions:**
1. Add deduplication logic in Zapier
2. Check for multiple triggers
3. Verify user email uniqueness

### **Issue: Automation not triggering**
**Solutions:**
1. Check Sharetribe API connection
2. Verify trigger conditions
3. Test with manual trigger
4. Check Zapier account limits

## 💰 **Cost Considerations**

### **Zapier Pricing**
- **Free**: 100 tasks/month, 5 Zaps
- **Starter**: $19.99/month, 750 tasks/month
- **Professional**: $49/month, 2,000 tasks/month

### **Make.com Pricing**
- **Free**: 1,000 operations/month
- **Core**: $9/month, 10,000 operations/month
- **Pro**: $16/month, 100,000 operations/month

## 🎉 **Expected Results**

With this setup, you'll have:
- ✅ **Automatic referral tracking** without code changes
- ✅ **UTM parameter handling** via automation
- ✅ **Real-time affiliate commissions**
- ✅ **Scalable solution** for multiple affiliates
- ✅ **Reliable tracking** via external automation
- ✅ **No Sharetribe limitations** affecting your system

## 🚀 **Next Steps**

1. **Choose your automation tool** (Zapier recommended)
2. **Set up the trigger** for new Sharetribe users
3. **Configure the webhook action** to call your API
4. **Test the automation** with a sample user
5. **Monitor and optimize** the workflow

**This solution provides reliable affiliate tracking without requiring any changes to your Sharetribe marketplace!** 🎉 