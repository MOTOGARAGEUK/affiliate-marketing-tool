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
    
    const response = await fetch('https://auth.sharetribe.com/oauth/token', {
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
    // Use the correct Sharetribe API base URL
    const baseUrl = 'https://api.sharetribe.com/v1';
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Sharetribe API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<SharetribeUser | null> {
    try {
      const response = await this.makeRequest(`/users?email=${encodeURIComponent(email)}`);
      
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
      const response = await this.makeRequest(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  // Get transactions for a user
  async getUserTransactions(userId: string, limit: number = 50): Promise<SharetribeTransaction[]> {
    try {
      const response = await this.makeRequest(`/transactions?user_id=${userId}&limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }

  // Get all users (for tracking new signups)
  async getUsers(limit: number = 100, offset: number = 0): Promise<SharetribeUser[]> {
    try {
      const response = await this.makeRequest(`/users?limit=${limit}&offset=${offset}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Sharetribe API connection...');
      console.log('Client ID:', this.config.clientId ? 'Set' : 'Not set');
      console.log('Client Secret:', this.config.clientSecret ? 'Set' : 'Not set');
      
      const response = await this.makeRequest('/users?limit=1');
      console.log('API connection successful:', response);
      return true;
    } catch (error) {
      console.error('Sharetribe API connection test failed:', error);
      return false;
    }
  }

  // Get marketplace info
  async getMarketplaceInfo(): Promise<any> {
    try {
      const response = await this.makeRequest('');
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