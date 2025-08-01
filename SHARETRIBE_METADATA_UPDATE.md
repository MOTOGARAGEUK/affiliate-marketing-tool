# Sharetribe User Metadata Update

## 🎯 **Overview**

The tracking script now includes functionality to write metadata directly to Sharetribe users when they complete signup. This stores the referral code and related information in the user's profile for future reference.

## 🚀 **How It Works**

### **Metadata Structure**
When a user completes signup, the following metadata is added to their Sharetribe profile:

```json
{
  "referralCode": "AFFILIATE_CODE",
  "referredAt": "2024-01-15T10:30:00.000Z",
  "source": "affiliate_tracking"
}
```

### **Update Methods**

The system uses multiple methods to ensure the metadata is properly stored:

#### **1. Client-Side Updates (Primary)**
- **Form Injection**: Adds hidden fields to profile forms
- **API Integration**: Uses Sharetribe's client-side API if available
- **Event Dispatching**: Triggers custom events for other scripts

#### **2. Server-Side Updates (Backup)**
- **API Call**: Uses Sharetribe's server-side API
- **Database Storage**: Stores metadata in our database for reference
- **Error Handling**: Graceful fallback if updates fail

## 📋 **Implementation Details**

### **Client-Side Script Updates**

The tracking script now includes these new methods:

```javascript
// Updates Sharetribe user metadata
updateSharetribeUserMetadata() {
  // Method 1: Try API update
  this.updateViaAPI();
  
  // Method 2: Try form injection
  this.updateViaForm();
  
  // Method 3: Store for later
  this.storeForLaterUpdate();
}
```

### **Form Injection Method**

Automatically adds referral code to profile forms:

```javascript
updateViaForm() {
  const profileForms = document.querySelectorAll('form[action*="profile"], form[action*="account"]');
  
  profileForms.forEach(form => {
    let referralField = form.querySelector('input[name="referralCode"]');
    
    if (!referralField) {
      referralField = document.createElement('input');
      referralField.type = 'hidden';
      referralField.name = 'referralCode';
      referralField.value = this.referralCode;
      form.appendChild(referralField);
    }
  });
}
```

### **Server-Side API Updates**

Uses Sharetribe's API to update user metadata:

```typescript
async updateUserMetadata(userId: string, metadata: any): Promise<boolean> {
  const response = await this.makeRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        type: 'user',
        id: userId,
        attributes: {
          publicData: metadata
        }
      }
    })
  });
}
```

## 🗄️ **Database Storage**

### **User Metadata Table**

Created `user_metadata` table to store metadata locally:

```sql
CREATE TABLE user_metadata (
  id UUID PRIMARY KEY,
  sharetribe_user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  referral_code TEXT,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Metadata Structure**

The metadata JSONB field contains:

```json
{
  "referralCode": "AFFILIATE_CODE",
  "referredAt": "2024-01-15T10:30:00.000Z",
  "source": "affiliate_tracking",
  "affiliateId": "affiliate-uuid",
  "affiliateName": "Affiliate Name"
}
```

## 🧪 **Testing**

### **Test Metadata Updates**

1. **Complete a signup** with referral code
2. **Check browser console** for metadata update logs
3. **Verify in Sharetribe** that user has referralCode metadata
4. **Check database** for metadata record

### **Console Logs to Look For**

```
[Affiliate Tracking] Updating Sharetribe user metadata with referral code: AFFILIATE_CODE
[Affiliate Tracking] Added referral code field to profile form
[Affiliate Tracking] Dispatched referralCodeCaptured event
```

### **API Logs to Check**

```
🔄 Updating Sharetribe user metadata: { userEmail: 'user@example.com', referralCode: 'AFFILIATE_CODE' }
✅ Found user in Sharetribe: user-id
📝 Updating user metadata with: { referralCode: 'AFFILIATE_CODE', referredAt: '...', source: 'affiliate_tracking' }
✅ User metadata updated successfully in Sharetribe
✅ Metadata stored in database for user: user-id
```

## 🔍 **Verifying Metadata**

### **In Sharetribe Admin Panel**

1. Go to **Users** section
2. Find the user who signed up
3. Check their **Public Data** section
4. Look for `referralCode` field

### **Via API Query**

```bash
curl -X GET "https://api.sharetribe.com/v1/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **In Your Database**

```sql
SELECT * FROM user_metadata 
WHERE user_email = 'user@example.com';
```

## 🚨 **Troubleshooting**

### **Issue: Metadata not being updated**
**Solutions:**
1. Check Sharetribe API credentials
2. Verify user exists in Sharetribe
3. Check API response for errors
4. Review form injection logic

### **Issue: Form injection not working**
**Solutions:**
1. Check form selectors match Sharetribe's structure
2. Verify referral code is available
3. Test with debug mode enabled
4. Check browser console for errors

### **Issue: API update failing**
**Solutions:**
1. Verify Sharetribe API permissions
2. Check API endpoint format
3. Review request payload structure
4. Check API response for error details

## 🔒 **Security Considerations**

### **Data Protection**
- Only stores referral code (not sensitive data)
- Uses Sharetribe's secure API
- Validates all input data
- Implements proper error handling

### **Access Control**
- API calls use proper authentication
- Database access is properly secured
- User data is protected by RLS policies

## 🎉 **Benefits**

This metadata update feature provides:
- ✅ **Permanent storage** of referral codes in Sharetribe
- ✅ **Multiple update methods** for reliability
- ✅ **Database backup** for reference
- ✅ **Easy verification** of referral tracking
- ✅ **Future-proof** for additional metadata needs

## 🚀 **Next Steps**

1. **Deploy the updated tracking script** to Sharetribe
2. **Run the database migration** for user_metadata table
3. **Test with a sample signup** to verify metadata updates
4. **Monitor the logs** to ensure updates are working
5. **Verify metadata** appears in Sharetribe user profiles

**This metadata update feature ensures referral codes are permanently stored in Sharetribe user profiles!** 🎉 