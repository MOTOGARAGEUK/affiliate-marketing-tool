import { createClient } from '@supabase/supabase-js';

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
  lastTransition?: string;
  totalPrice?: {
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
  state?: string;
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
  private sdk: any;
  private config: SharetribeConfig;

  constructor(config: SharetribeConfig) {
    this.config = config;
  }

  private async getSDK() {
    if (!this.sdk) {
      try {
        const sharetribeIntegrationSdk = await import('sharetribe-flex-integration-sdk');
        
        console.log('🔧 Creating ShareTribe SDK...');
        console.log('🔧 Client ID:', this.config.clientId ? 'SET' : 'NOT SET');
        console.log('🔧 Client Secret:', this.config.clientSecret ? 'SET' : 'NOT SET');
        console.log('🔧 Marketplace URL (optional):', this.config.marketplaceUrl || 'NOT SET - SDK will auto-detect');
        
        // Create SDK instance with just client credentials
        // The SDK should auto-detect the marketplace from the client ID
        this.sdk = sharetribeIntegrationSdk.createInstance({
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret
        });
        
        console.log('✅ ShareTribe SDK instance created successfully');
      } catch (error) {
        console.error('❌ Failed to create ShareTribe SDK instance:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
      }
    }
    return this.sdk;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<SharetribeUser | null> {
    try {
      console.log('🔍 Searching for user by email:', email);
      
      // First, try to get all users properly
      const allUsers = await this.getUsers(1000);
      console.log(`🔍 Found ${allUsers.length} total users in ShareTribe`);
      
      if (allUsers.length === 0) {
        console.log('❌ No users found in ShareTribe - users query is failing');
        return null;
      }
      
      // Search through all users for the email
      const user = allUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() ||
        u.attributes?.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (user) {
        console.log('✅ User found by email search:', user.id, user.email);
        return user;
      }
      
      console.log('❌ No user found with email:', email);
      return null;
    } catch (error) {
      console.error('❌ Error fetching user by email:', error);
      return null;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<SharetribeUser | null> {
    try {
      console.log('Fetching user by ID:', userId);
      
      const sdk = await this.getSDK();
      const response = await sdk.users.show({ id: userId });
      
      if (response.data && response.data.data) {
        const userData = response.data.data;
        console.log('User found:', userData.id);
        
        return {
          id: userData.id,
          email: userData.attributes.email,
          profile: userData.attributes.profile || {},
          attributes: userData.attributes,
          createdAt: userData.attributes.createdAt
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  // Get transactions for a user
  async getUserTransactions(userId: string, limit: number = 50): Promise<SharetribeTransaction[]> {
    try {
      console.log('Fetching transactions for user:', userId);
      
      const sdk = await this.getSDK();
      
      // Use documented ShareTribe endpoint: /v1/integration_api/transactions/query
      // Note: ShareTribe doesn't support direct user filtering, so we get all and filter
      const response = await sdk.transactions.query({
        perPage: limit
      });
      
      console.log('Transactions response:', {
        totalCount: response.data?.meta?.totalItems,
        dataLength: response.data?.data?.length
      });
      
      if (response.data && response.data.data) {
        // Filter transactions where user is involved (as buyer or seller)
        const allTransactions = response.data.data;
        const userTransactions = allTransactions.filter((transaction: any) => {
          const provider = transaction.relationships?.provider?.data?.id;
          const customer = transaction.relationships?.customer?.data?.id;
          return provider === userId || customer === userId;
        });
        
        const transactions = userTransactions.map((transaction: any) => ({
          id: transaction.id,
          type: 'transaction',
          lastTransition: transaction.attributes.lastTransition,
          totalPrice: transaction.attributes.totalPrice,
          attributes: transaction.attributes
        }));
        
        console.log('User transactions found:', transactions.length);
        return transactions;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }

  // Get listings for a user
  async getUserListings(userId: string, limit: number = 50): Promise<SharetribeListing[]> {
    try {
      console.log('📋 Fetching listings for user:', userId);
      
      const sdk = await this.getSDK();
      
      // Use documented ShareTribe endpoint: /v1/integration_api/listings/query
      console.log('🔍 Querying listings with author:', userId);
      const response = await sdk.listings.query({ 
        author: userId, // Documented parameter for filtering by author
        perPage: limit
      });
      
      console.log('📊 Listings response:', {
        totalCount: response.data?.meta?.totalItems,
        dataLength: response.data?.data?.length,
        queryParams: { author_id: userId, perPage: limit }
      });
      
      if (response.data && response.data.data) {
        const listings = response.data.data.map((listing: any) => ({
          id: listing.id,
          type: 'listing',
          state: listing.attributes.state,
          attributes: listing.attributes
        }));
        
        console.log('✅ Processed listings:', listings.length);
        console.log('📋 Listing details:', listings.map((l: SharetribeListing) => ({ id: l.id, state: l.attributes.state, title: l.attributes.title })));
        return listings;
      }
      
      console.log('❌ No listings found for user:', userId);
      return [];
    } catch (error) {
      console.error('❌ Error fetching user listings:', error);
      return [];
    }
  }

  // Get comprehensive user stats (listings, transactions, revenue)
  async getUserStats(userId: string): Promise<SharetribeUserStats | null> {
    try {
      console.log('🔍 getUserStats: Starting for user:', userId);
      
      // Get user details
      console.log('🔍 getUserStats: Getting user details...');
      const user = await this.getUserById(userId);
      if (!user) {
        console.log('❌ getUserStats: User not found:', userId);
        return null;
      }

      console.log('✅ getUserStats: User found:', user.id, user.email);

      // Get user's listings - simple approach
      console.log('🔍 getUserStats: Getting listings...');
      const listings = await this.getUserListings(userId, 1000);
      console.log('✅ getUserStats: Total listings found:', listings.length);

      // Get user's transactions - simple approach  
      console.log('🔍 getUserStats: Getting transactions...');
      const transactions = await this.getUserTransactions(userId, 1000);
      console.log('✅ getUserStats: Total transactions found:', transactions.length);

      // Simple stats calculation
      const activeListings = listings.filter(listing => {
        const state = listing.attributes?.state || listing.state;
        return state === 'published' || state === 'active';
      });

      const completedTransactions = transactions.filter(transaction => {
        const lastTransition = transaction.attributes?.lastTransition || transaction.lastTransition;
        return lastTransition === 'confirmed' || lastTransition === 'completed';
      });

      // Calculate total revenue
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

      console.log('✅ getUserStats: Final stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ getUserStats: Error in getUserStats:', error);
      console.error('❌ getUserStats: Error stack:', error instanceof Error ? error.stack : 'No stack');
      return null;
    }
  }

  // Test raw users API call
  async testRawUsersAPI(): Promise<any> {
    try {
      console.log('🔍 Testing raw users API call...');
      
      const sdk = await this.getSDK();
      const response = await sdk.users.query({ perPage: 1000 });
      
      console.log('📊 Raw API response:', {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        totalItems: response.data?.meta?.totalItems,
        currentPage: response.data?.meta?.page,
        perPage: response.data?.meta?.perPage,
        dataLength: response.data?.data?.length
      });
      
      return {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        totalItems: response.data?.meta?.totalItems,
        currentPage: response.data?.meta?.page,
        perPage: response.data?.meta?.perPage,
        dataLength: response.data?.data?.length,
        rawData: response.data?.data ? response.data.data.map((u: any) => ({
          id: u.id,
          email: u.attributes.email,
          displayName: u.attributes.profile?.displayName
        })) : []
      };
    } catch (error) {
      console.error('❌ Error in raw users API test:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get all users
  async getUsers(limit: number = 100, offset: number = 0): Promise<SharetribeUser[]> {
    try {
      console.log('👥 Fetching users with limit:', limit, 'offset:', offset);
      
      const sdk = await this.getSDK();
      if (!sdk) {
        console.error('❌ SDK not available');
        return [];
      }

      // Use the proper Integration API users.query method
      console.log('🔍 Using sdk.users.query() with limit:', limit);
      
      const response = await sdk.users.query({
        limit: limit,
        offset: offset
      });
      
      if (response && response.data && response.data.data) {
        const users = response.data.data.map((user: any) => ({
          id: user.id,
          email: user.attributes.email,
          profile: user.attributes.profile || {},
          attributes: user.attributes,
          createdAt: user.attributes.createdAt
        }));
        
        console.log(`✅ Found ${users.length} users from ShareTribe`);
        return users;
      } else {
        console.log('⚠️ No users found or invalid response');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error fetching users from ShareTribe:', error);
      return [];
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔧 Testing ShareTribe SDK connection...');
      
      const sdk = await this.getSDK();
      console.log('🔧 SDK created, testing marketplace.show()...');
      
      const response = await sdk.marketplace.show();
      console.log('🔧 Marketplace.show() response:', response);
      
      if (response.data && response.data.data) {
        console.log('✅ Connection successful, marketplace:', response.data.data.attributes.name);
        return true;
      }
      
      console.log('❌ Connection failed - no data in response');
      console.log('❌ Response structure:', JSON.stringify(response, null, 2));
      return false;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Log additional error information if available
      if (error && typeof error === 'object') {
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      }
      
      return false;
    }
  }

  // Get marketplace info
  async getMarketplaceInfo(): Promise<any> {
    try {
      console.log('Fetching marketplace info...');
      
      const sdk = await this.getSDK();
      const response = await sdk.marketplace.show();
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return null;
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
      
      const sdk = await this.getSDK();
      const response = await sdk.users.update({
        id: userId,
        profile: metadata
      });
      
      if (response.data && response.data.data) {
        console.log('User metadata updated successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating user metadata:', error);
      return false;
    }
  }
}

export function createSharetribeAPI(config: SharetribeConfig): SharetribeAPI {
  return new SharetribeAPI(config);
}

export async function getSharetribeCredentials(userId: string): Promise<SharetribeConfig | null> {
  try {
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

    if (error) {
      console.error('Error fetching ShareTribe settings:', error);
      return null;
    }

    if (!settings || settings.length === 0) {
      console.log('No ShareTribe settings found for user:', userId);
      return null;
    }

    // Convert settings array to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    // Check if we have the required credentials
    // Try Integration API first (for user lookups), then Marketplace API as fallback
    if (settingsObj.integrationClientId && settingsObj.integrationClientSecret) {
      console.log('✅ Using Integration API credentials for user lookups');
      return {
        clientId: settingsObj.integrationClientId,
        clientSecret: settingsObj.integrationClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl // Optional - SDK will auto-detect
      };
    } else if (settingsObj.marketplaceClientId && settingsObj.marketplaceClientSecret) {
      console.log('✅ Using Marketplace API credentials (fallback)');
      return {
        clientId: settingsObj.marketplaceClientId,
        clientSecret: settingsObj.marketplaceClientSecret,
        marketplaceUrl: settingsObj.marketplaceUrl // Optional - SDK will auto-detect
      };
    } else {
      console.log('Missing required ShareTribe credentials');
      return null;
    }
  } catch (error) {
    console.error('Error getting ShareTribe credentials:', error);
    return null;
  }
}

export function extractReferralCode(user: SharetribeUser): string | null {
  // Check for referral code in profile
  if (user.profile?.referralCode) {
    return user.profile.referralCode;
  }
  
  // Check for affiliate code in profile
  if (user.profile?.affiliateCode) {
    return user.profile.affiliateCode;
  }
  
  // Check in attributes
  if (user.attributes?.profile?.referralCode) {
    return user.attributes.profile.referralCode;
  }
  
  if (user.attributes?.profile?.affiliateCode) {
    return user.attributes.profile.affiliateCode;
  }
  
  return null;
}

export function isRecentSignup(user: SharetribeUser, hours: number = 24): boolean {
  const createdAt = new Date(user.createdAt);
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  return createdAt > cutoffTime;
} 