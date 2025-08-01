// Sharetribe API utilities for marketplace integration

export interface SharetribeConfig {
  clientId: string;
  clientSecret: string;
  marketplaceUrl?: string;
}

export interface SharetribeUser {
  id: string;
  email: string;
  profile: {
    displayName?: string;
    abbreviatedName?: string;
    firstName?: string;
    lastName?: string;
    referralCode?: string;
    affiliateCode?: string;
  };
  attributes: {
    email: string;
    profile: {
      displayName?: string;
      abbreviatedName?: string;
      firstName?: string;
      lastName?: string;
      referralCode?: string;
      affiliateCode?: string;
    };
    [key: string]: any;
  };
  createdAt: string;
}

export interface SharetribeTransaction {
  id: string;
  type: 'transaction';
  lastTransition?: string; // Add direct lastTransition property
  totalPrice?: { // Add direct totalPrice property
    amount: number;
    currency: string;
  };
  attributes: {
    lastTransition: string;
    lastTransitionedAt: string;
    createdAt: string;
    updatedAt: string;
    totalPrice: {
      amount: number;
      currency: string;
    };
    commission: {
      amount: number;
      currency: string;
    };
    [key: string]: any;
  };
}

export interface SharetribeListing {
  id: string;
  type: 'listing';
  state?: string; // Add direct state property
  attributes: {
    title: string;
    description: string;
    state: string;
    createdAt: string;
    updatedAt: string;
    price: {
      amount: number;
      currency: string;
    };
    [key: string]: any;
  };
}

export interface SharetribeUserStats {
  userId: string;
  createdAt: string;
  listingsCount: number;
  transactionsCount: number;
  totalRevenue: number;
  currency: string;
}

class SharetribeAPI {
  private config: SharetribeConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: SharetribeConfig) {
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Get new access token
    console.log('Requesting access token from Sharetribe...');
    
    // Use the correct auth URL as per ShareTribe documentation
    const authUrl = 'https://auth.sharetribe.com/oauth/token';
    
    console.log('Using auth URL:', authUrl);
    console.log('Marketplace URL:', this.config.marketplaceUrl);
    
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    console.log('Token response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token request failed:', errorText);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Token response data:', { access_token: data.access_token ? 'Received' : 'Missing', expires_in: data.expires_in });
    
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 minute early

    return this.accessToken || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAccessToken();
    
    // Use the Integration API base URL as per ShareTribe documentation
    const baseUrl = 'https://flex-integ-api.sharetribe.com/v1';
    const url = `${baseUrl}${endpoint}`;
    
    console.log('Making ShareTribe API request to:', url);
    console.log('Marketplace URL:', this.config.marketplaceUrl);
    console.log('Using API base URL:', baseUrl);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ShareTribe API error:', response.status, response.statusText, errorText);
      throw new Error(`Sharetribe API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<SharetribeUser | null> {
    try {
      const response = await this.makeRequest(`/integration_api/users/query?email=${encodeURIComponent(email)}`);
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<SharetribeUser | null> {
    try {
      const response = await this.makeRequest(`/integration_api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  // Get transactions for a user
  async getUserTransactions(userId: string, limit: number = 50): Promise<SharetribeTransaction[]> {
    try {
      const response = await this.makeRequest(`/integration_api/transactions/query?user_id=${userId}&limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }

  // Get listings for a user
  async getUserListings(userId: string, limit: number = 50): Promise<SharetribeListing[]> {
    try {
      const response = await this.makeRequest(`/integration_api/listings/query?user_id=${userId}&limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user listings:', error);
      return [];
    }
  }

  // Get comprehensive user stats (listings, transactions, revenue)
  async getUserStats(userId: string): Promise<SharetribeUserStats | null> {
    try {
      console.log('Fetching comprehensive stats for user:', userId);
      
      // Get user details
      const user = await this.getUserById(userId);
      if (!user) {
        console.log('User not found:', userId);
        return null;
      }

      console.log('User found:', user);

      // Get user's listings
      const listings = await this.getUserListings(userId, 100);
      console.log('Listings found:', listings.length);
      
      const activeListings = listings.filter(listing => {
        const state = listing.attributes?.state || listing.state;
        return state === 'published' || state === 'active';
      });

      // Get user's transactions (both as buyer and seller)
      const transactions = await this.getUserTransactions(userId, 100);
      console.log('Transactions found:', transactions.length);
      
      const completedTransactions = transactions.filter(transaction => {
        const lastTransition = transaction.attributes?.lastTransition || transaction.lastTransition;
        return lastTransition === 'confirmed' || lastTransition === 'completed';
      });

      // Calculate total revenue from completed transactions
      let totalRevenue = 0;
      let currency = 'USD';
      
      completedTransactions.forEach(transaction => {
        const totalPrice = transaction.attributes?.totalPrice || transaction.totalPrice;
        if (totalPrice && totalPrice.amount) {
          totalRevenue += totalPrice.amount;
          currency = totalPrice.currency || currency;
        }
      });

      // Get user creation date
      const createdAt = user.createdAt || user.attributes?.createdAt || new Date().toISOString();

      const stats: SharetribeUserStats = {
        userId: userId,
        createdAt: createdAt,
        listingsCount: activeListings.length,
        transactionsCount: completedTransactions.length,
        totalRevenue: totalRevenue,
        currency: currency
      };

      console.log('User stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  // Get all users
  async getUsers(limit: number = 100, offset: number = 0): Promise<SharetribeUser[]> {
    try {
      const response = await this.makeRequest(`/integration_api/users/query?limit=${limit}&offset=${offset}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/integration_api/marketplace/show');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Get marketplace info
  async getMarketplaceInfo(): Promise<any> {
    try {
      const response = await this.makeRequest('/integration_api/marketplace/show');
      return response.data;
    } catch (error) {
      console.error('Error fetching marketplace info:', error);
      return null;
    }
  }

  // Update user metadata
  async updateUserMetadata(userId: string, metadata: any): Promise<boolean> {
    try {
      console.log('Updating user metadata for user:', userId);
      console.log('Metadata to update:', metadata);
      
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
      
      console.log('User metadata updated successfully:', response);
      return true;
    } catch (error) {
      console.error('Error updating user metadata:', error);
      return false;
    }
  }
}

export default SharetribeAPI;

// Utility function to create Sharetribe API instance
export function createSharetribeAPI(config: SharetribeConfig): SharetribeAPI {
  return new SharetribeAPI(config);
}

// Utility function to get ShareTribe credentials from database
export async function getSharetribeCredentials(userId: string): Promise<SharetribeConfig | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get ShareTribe settings from the settings table
    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .eq('user_id', userId)
      .eq('setting_type', 'sharetribe');

    if (error || !settings || settings.length === 0) {
      console.log('No ShareTribe settings found for user:', userId);
      return null;
    }

    // Convert settings array to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    console.log('Found ShareTribe settings:', Object.keys(settingsObj));

    // Check if marketplace API credentials are available
    if (settingsObj.marketplaceClientId && settingsObj.marketplaceClientSecret && settingsObj.marketplaceUrl) {
      return {
        clientId: settingsObj.marketplaceClientId,
        clientSecret: settingsObj.marketplaceClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl
      };
    }
    
    // Check if integration API credentials are available
    if (settingsObj.integrationClientId && settingsObj.integrationClientSecret && settingsObj.marketplaceUrl) {
      return {
        clientId: settingsObj.integrationClientId,
        clientSecret: settingsObj.integrationClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl
      };
    }

    console.log('No valid ShareTribe credentials found in settings:', settingsObj);
    return null;

  } catch (error) {
    console.error('Error fetching ShareTribe credentials:', error);
    return null;
  }
}

// Utility function to extract referral code from user attributes
export function extractReferralCode(user: SharetribeUser): string | null {
  // Check various possible locations for referral code
  const possibleLocations = [
    user.attributes?.referralCode,
    user.attributes?.affiliateCode,
    user.attributes?.refCode,
    user.attributes?.profile?.referralCode,
    user.attributes?.profile?.affiliateCode,
  ];

  for (const code of possibleLocations) {
    if (code && typeof code === 'string') {
      return code;
    }
  }

  return null;
}

// Utility function to check if user was created recently (within last 24 hours)
export function isRecentSignup(user: SharetribeUser, hours: number = 24): boolean {
  const createdAt = new Date(user.createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= hours;
} 