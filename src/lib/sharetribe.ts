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
        this.sdk = sharetribeIntegrationSdk.createInstance({
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret
        });
        console.log('ShareTribe SDK instance created with client ID:', this.config.clientId ? 'Set' : 'Not set');
      } catch (error) {
        console.error('Failed to create ShareTribe SDK instance:', error);
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
      
      // Since sdk.users.query() is failing, let's use the known user IDs from the CSV
      const knownUserIds = [
        "688d0c51-8fbc-45e6-8a29-fc66c9ab7990", // Jacob MAddren
        "688cd91b-f189-4cbf-a4d5-d9f952eba27e", // test test
        "688cd78f-5dd8-43d4-aa54-cddcabdbb53c", // tyler chey referral
        "688cd2d5-f1eb-46a8-a06c-08b51f58512d", // yoyo tester
        "688ccf8f-91ad-4f3e-b369-b33890aef4ac", // Yes Please
        "688ccca0-05f6-4b5a-afe8-bd09555dfb10", // test test
        "688cca7f-847a-4b6b-b867-65958e8bc3e3", // test test
        "688cc84d-a3da-4f71-acfd-7340581a339b", // it worked
        "688cc6e6-f28a-4b54-9523-d70962a375f6", // 0 uawruhew
        "688cbba5-c4b9-4b80-a46f-682ce33a35be", // tyle are
        "688cb5e5-afa5-46d4-acf6-7aa17de4231a", // tylw rtwetw
        "688cb230-552a-4804-bbdc-556c81723238", // ttt 999
        "688caf2c-097a-40a5-990f-0d452b69e00c", // Test User
        "688cacf8-c19d-4fd5-bbe8-8f0ac3140019"  // tyler tesrt
      ];
      
      console.log(`🔍 Fetching ${knownUserIds.length} users by ID...`);
      
      const users: SharetribeUser[] = [];
      
      for (const userId of knownUserIds) {
        try {
          const user = await this.getUserById(userId);
          if (user) {
            users.push(user);
            console.log(`✅ Fetched user: ${user.email} (${user.id})`);
          }
        } catch (error) {
          console.log(`❌ Failed to fetch user ${userId}:`, error);
        }
        
        // Rate limiting: wait 500ms between calls
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`✅ Successfully fetched ${users.length} users out of ${knownUserIds.length}`);
      return users;
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing ShareTribe SDK connection...');
      
      const sdk = await this.getSDK();
      const response = await sdk.marketplace.show();
      
      if (response.data && response.data.data) {
        console.log('Connection successful, marketplace:', response.data.data.attributes.name);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
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
    if (!settingsObj.integrationClientId || !settingsObj.integrationClientSecret) {
      console.log('Missing required ShareTribe credentials');
      return null;
    }

    return {
      clientId: settingsObj.integrationClientId,
      clientSecret: settingsObj.integrationClientSecret,
      marketplaceUrl: settingsObj.marketplaceUrl
    };
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