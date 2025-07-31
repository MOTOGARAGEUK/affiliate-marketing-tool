# Affiliate Marketing Tool for Sharetribe Marketplaces

A comprehensive affiliate marketing tool designed specifically for Sharetribe marketplaces. This tool allows you to manage affiliate programs, track referrals, and process payouts.

## Features

### 🏠 Dashboard
- Overview of affiliate marketing performance
- Key metrics and statistics
- Recent activity feed
- Performance charts

### 📊 Programs
- Create and manage affiliate programs
- Two types: Sign-up referrals and Purchase referrals
- **Smart Commission Types**: 
  - Sign-up programs: Fixed dollar amounts only ($)
  - Purchase programs: Percentage (%) or Fixed dollar amounts ($)
- Program status management
- Automatic commission type validation

### 👥 Affiliates
- Manage affiliate partners
- Track individual performance
- **Automatic Referral Link Generation**: Unique links created when affiliates are added
- **Copy-to-Clipboard**: Easy sharing of referral codes and links
- Commission rate management
- Real-time referral link preview during creation

### 💰 Payouts
- Process affiliate payouts
- Multiple payment methods (Bank Transfer, PayPal, Stripe)
- Payout status tracking
- Payment history

### 🔗 Integrations
- Connect with Sharetribe marketplaces
- Support for other platforms (Shopify, WooCommerce)
- API configuration
- Integration status monitoring

### ⚙️ Settings
- General application settings
- Profile management
- Notification preferences
- Security settings

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd affiliate-marketing-tool
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Affiliate Programs

1. Navigate to **Programs** in the sidebar
2. Click **Create Program**
3. Choose program type:
   - **Sign Up Referrals**: Earn commission when new users sign up (Fixed $ amounts only)
   - **Purchase Referrals**: Earn commission on customer purchases (Percentage % or Fixed $ amounts)
4. Set commission rate and type (automatically validated based on program type)
5. Configure program settings

### Managing Affiliates

1. Go to **Affiliates** section
2. Click **Add Affiliate**
3. Enter affiliate details
4. **Select Program**: Choose which affiliate program the affiliate will participate in
5. **Automatic Commission**: Commission rate is automatically determined by the selected program
6. **Automatic Referral Link Generation**: Unique referral code and link are automatically created
7. **Copy Links**: Use the copy buttons to easily share referral codes and links

### Commission Types

The tool intelligently manages commission types based on program type:

- **Sign-up Programs**: Only support fixed dollar amounts (e.g., $10 per signup)
- **Purchase Programs**: Support both percentage (e.g., 15% of sale) and fixed amounts (e.g., $5 per purchase)

### Affiliate-Program Assignment

Affiliates are assigned to specific programs, which determines their commission structure:

- **Program Selection**: When creating an affiliate, you must select which program they will participate in
- **Commission Inheritance**: The affiliate's commission rate and type are inherited from the selected program
- **Flexible Assignment**: Affiliates can be reassigned to different programs if needed
- **Program Details**: The system shows program details including commission rate and type during affiliate creation

### Tracking Referrals

The tool automatically generates unique referral links for each affiliate. These links can be used to track:

- **Sign-ups**: `https://yourdomain.com/api/track?ref=AFF123&type=signup&email=customer@example.com`
- **Purchases**: `https://yourdomain.com/api/track?ref=AFF123&type=purchase&email=customer@example.com&amount=150`

## Sharetribe Integration

### Setup Instructions

1. **Get Your Sharetribe Credentials**:
   - **Client ID**: Found in Sharetribe admin panel → Settings → API
   - **Client Secret**: Generate in Sharetribe admin panel → Settings → API

2. **Configure Integration**:
   - Go to **Settings** → **Integrations** tab
   - Enter your Client ID and Client Secret
   - Test the connection
   - Save the integration

3. **Add Referral Tracking to Your Marketplace**:

#### Option A: URL Parameter Tracking
Add referral codes to your marketplace signup URLs:
```
https://your-marketplace.sharetribe.com/signup?ref=AFF123
```

#### Option B: Custom User Attributes
Modify your Sharetribe marketplace to store referral codes in user attributes:

```javascript
// In your Sharetribe marketplace code
const referralCode = new URLSearchParams(window.location.search).get('ref');

if (referralCode) {
  // Store referral code in user attributes during signup
  const userAttributes = {
    ...existingAttributes,
    referralCode: referralCode
  };
}
```

#### Option C: Webhook Integration
Set up webhooks in your Sharetribe marketplace to notify the affiliate tool when new users sign up.

### API Endpoints

#### Test Sharetribe Connection
```bash
POST /api/test-sharetribe
Content-Type: application/json

{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}
```

#### Sync Users from Sharetribe
```bash
POST /api/sync-sharetribe
Content-Type: application/json

{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "hours": 24
}
```

#### Track Referral with Sharetribe Verification
```bash
POST /api/track
Content-Type: application/json

{
  "ref": "AFF123",
  "type": "signup",
  "customerEmail": "customer@example.com",
  "sharetribeConfig": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  }
}
```

### Automatic Tracking

The system can automatically track affiliate referrals by:

1. **Periodic Sync**: Set up a cron job to call `/api/sync-sharetribe` every hour
2. **Real-time Tracking**: Use webhooks to track signups immediately
3. **Manual Sync**: Use the sync button in the Integrations settings

### Referral Code Storage

The system looks for referral codes in these user attribute locations:
- `user.attributes.referralCode`
- `user.attributes.affiliateCode`
- `user.attributes.refCode`
- `user.attributes.profile.referralCode`
- `user.attributes.profile.affiliateCode`

### Environment Variables

Add these to your `.env.local` file:

```env
# Sharetribe Configuration
SHARETRIBE_CLIENT_ID=your-client-id
SHARETRIBE_CLIENT_SECRET=your-client-secret
SHARETRIBE_MARKETPLACE_URL=https://your-marketplace.sharetribe.com

# Affiliate Tool Configuration
NEXT_PUBLIC_APP_URL=https://your-affiliate-tool.com
MARKETPLACE_URL=https://your-marketplace.sharetribe.com
```

## Deployment

### Quick Deploy to Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/affiliate-marketing-tool.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will automatically detect it's a Next.js app
   - Click "Deploy"

3. **Set Environment Variables**:
   - In your Vercel project dashboard
   - Go to Settings → Environment Variables
   - Add your Sharetribe credentials:
     ```
     SHARETRIBE_CLIENT_ID=your-client-id
     SHARETRIBE_CLIENT_SECRET=your-client-secret
     SHARETRIBE_MARKETPLACE_URL=https://your-marketplace.sharetribe.com
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     ```

### Alternative Deployment Options

#### **Netlify**
1. Push to GitHub
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `.next`

#### **Railway**
1. Push to GitHub
2. Connect to Railway
3. Automatic deployment

#### **DigitalOcean App Platform**
1. Push to GitHub
2. Create new app in DigitalOcean
3. Connect repository
4. Deploy

### Environment Variables

Create a `.env.local` file for local development:

```env
# Sharetribe Configuration
SHARETRIBE_CLIENT_ID=your-client-id
SHARETRIBE_CLIENT_SECRET=your-client-secret
SHARETRIBE_MARKETPLACE_URL=https://your-marketplace.sharetribe.com

# Affiliate Tool Configuration
NEXT_PUBLIC_APP_URL=https://your-affiliate-tool.com
MARKETPLACE_URL=https://your-marketplace.sharetribe.com
```

### Production Checklist

Before going live:

- [ ] Set up environment variables in your hosting platform
- [ ] Test all features in production
- [ ] Configure your Sharetribe API credentials
- [ ] Set up a custom domain (optional)
- [ ] Enable HTTPS (automatic with Vercel/Netlify)
- [ ] Test affiliate link generation
- [ ] Verify commission calculations
- [ ] Test user sync functionality

### Testing Your Live Deployment

1. **Test Basic Functionality**:
   - Create affiliate programs
   - Add affiliates
   - Generate referral links
   - Test commission calculations

2. **Test Sharetribe Integration**:
   - Configure your Sharetribe credentials
   - Test API connection
   - Sync users manually
   - Verify referral tracking

3. **Test Affiliate Links**:
   - Share generated links
   - Test tracking functionality
   - Verify commission attribution

### Monitoring & Maintenance

- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Consider adding Sentry for error monitoring
- **Database**: For production, consider adding a real database (PostgreSQL, MongoDB)
- **Backups**: Regular backups of your data
- **Updates**: Keep dependencies updated