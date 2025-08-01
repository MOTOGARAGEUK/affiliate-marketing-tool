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
      console.log('Searching for user by email:', email);
      
      const sdk = await this.getSDK();
      const response = await sdk.users.query({ email });
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const userData = response.data.data[0];
        console.log('User found:', userData.id);
        
        return {
          id: userData.id,
          email: userData.attributes.email,
          profile: userData.attributes.profile || {},
          attributes: userData.attributes,
          createdAt: userData.attributes.createdAt
        };
      }
      
      console.log('No user found with email:', email);
      return null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
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
      const response = await sdk.transactions.query({ 
        user_id: userId,
        perPage: limit
      });
      
      if (response.data && response.data.data) {
        return response.data.data.map((transaction: any) => ({
          id: transaction.id,
          type: 'transaction',
          lastTransition: transaction.attributes.lastTransition,
          totalPrice: transaction.attributes.totalPrice,
          attributes: transaction.attributes
        }));
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
      console.log('Fetching listings for user:', userId);
      
      const sdk = await this.getSDK();
      
      // First, try to get all listings without user_id filter to see total count
      const allListingsResponse = await sdk.listings.query({ 
        perPage: 1000 // Get a large number to see all listings
      });
      
      console.log('All listings response:', {
        totalCount: allListingsResponse.data?.meta?.totalItems,
        currentPage: allListingsResponse.data?.meta?.page,
        perPage: allListingsResponse.data?.meta?.perPage
      });
      
      // Now get user-specific listings
      const response = await sdk.listings.query({ 
        user_id: userId,
        perPage: limit
      });
      
      console.log('User listings response:', {
        totalCount: response.data?.meta?.totalItems,
        currentPage: response.data?.meta?.page,
        perPage: response.data?.meta?.perPage,
        dataLength: response.data?.data?.length
      });
      
      if (response.data && response.data.data) {
        const listings = response.data.data.map((listing: any) => ({
          id: listing.id,
          type: 'listing',
          state: listing.attributes.state,
          attributes: listing.attributes
        }));
        
        console.log('Processed listings:', listings.map((l: SharetribeListing) => ({ id: l.id, state: l.attributes.state, title: l.attributes.title })));
        return listings;
      }
      
      return [];
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

      // Get user's listings with detailed logging
      const sdk = await this.getSDK();
      
      // Get user-specific listings with total count
      const listingsResponse = await sdk.listings.query({ 
        user_id: userId,
        perPage: 1000 // Get a large number to ensure we get all listings
      });
      
      console.log('Listings API response:', {
        totalItems: listingsResponse.data?.meta?.totalItems,
        currentPage: listingsResponse.data?.meta?.page,
        perPage: listingsResponse.data?.meta?.perPage,
        dataLength: listingsResponse.data?.data?.length
      });
      
      let listings: SharetribeListing[] = [];
      if (listingsResponse.data && listingsResponse.data.data) {
        listings = listingsResponse.data.data.map((listing: any) => ({
          id: listing.id,
          type: 'listing',
          state: listing.attributes.state,
          attributes: listing.attributes
        }));
      }
      
      console.log('Total listings found:', listings.length);
      console.log('Listing states:', listings.map(l => l.attributes.state));
      
      const activeListings = listings.filter(listing => {
        const state = listing.attributes?.state || listing.state;
        const isActive = state === 'published' || state === 'active';
        console.log(`Listing ${listing.id}: state=${state}, active=${isActive}`);
        return isActive;
      });

      console.log('Active listings count:', activeListings.length);

      // Get user's transactions (both as buyer and seller)
      const transactionsResponse = await sdk.transactions.query({ 
        user_id: userId,
        perPage: 1000
      });
      
      console.log('Transactions API response:', {
        totalItems: transactionsResponse.data?.meta?.totalItems,
        currentPage: transactionsResponse.data?.meta?.page,
        perPage: transactionsResponse.data?.meta?.perPage,
        dataLength: transactionsResponse.data?.data?.length
      });
      
      let transactions: SharetribeTransaction[] = [];
      if (transactionsResponse.data && transactionsResponse.data.data) {
        transactions = transactionsResponse.data.data.map((transaction: any) => ({
          id: transaction.id,
          type: 'transaction',
          lastTransition: transaction.attributes.lastTransition,
          totalPrice: transaction.attributes.totalPrice,
          attributes: transaction.attributes
        }));
      }
      
      console.log('Total transactions found:', transactions.length);
      
      const completedTransactions = transactions.filter(transaction => {
        const lastTransition = transaction.attributes?.lastTransition || transaction.lastTransition;
        const isCompleted = lastTransition === 'confirmed' || lastTransition === 'completed';
        console.log(`Transaction ${transaction.id}: transition=${lastTransition}, completed=${isCompleted}`);
        return isCompleted;
      });

      console.log('Completed transactions count:', completedTransactions.length);

      // Calculate total revenue from completed transactions
      let totalRevenue = 0;
      let currency = 'USD';
      
      completedTransactions.forEach(transaction => {
        const totalPrice = transaction.attributes?.totalPrice || transaction.totalPrice;
        if (totalPrice && totalPrice.amount) {
          totalRevenue += totalPrice.amount;
          currency = totalPrice.currency || currency;
          console.log(`Transaction ${transaction.id}: revenue=${totalPrice.amount} ${totalPrice.currency}`);
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

      console.log('Final user stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  // Get all users
  async getUsers(limit: number = 100, offset: number = 0): Promise<SharetribeUser[]> {
    try {
      console.log('Fetching users with limit:', limit, 'offset:', offset);
      
      const sdk = await this.getSDK();
      const response = await sdk.users.query({ 
        perPage: limit,
        page: Math.floor(offset / limit) + 1
      });
      
      if (response.data && response.data.data) {
        return response.data.data.map((user: any) => ({
          id: user.id,
          email: user.attributes.email,
          profile: user.attributes.profile || {},
          attributes: user.attributes,
          createdAt: user.attributes.createdAt
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
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