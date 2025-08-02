export interface Program {
  id: string;
  name: string;
  type: 'signup' | 'purchase';
  commission: number;
  commissionType: 'percentage' | 'fixed';
  status: 'active' | 'inactive';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  program_id: string; // Reference to the program this affiliate is assigned to
  total_earnings: number;
  total_referrals: number;
  referral_code: string;
  referral_link: string;
  created_at: string;
  updated_at: string;
  // Bank details (optional)
  bank_account_name?: string;
  bank_account_number?: string;
  bank_sort_code?: string; // For GBP
  bank_iban?: string; // For EUR
  bank_routing_number?: string; // For USD
  bank_name?: string;
  // Keep camelCase versions for backward compatibility
  programId?: string;
  totalEarnings?: number;
  totalReferrals?: number;
  referralCode?: string;
  referralLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Referral {
  id: string;
  affiliateId: string;
  programId: string;
  customerEmail: string;
  customerName?: string;
  amount?: number;
  commission: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  type: 'signup' | 'purchase';
  createdAt: Date;
  updatedAt: Date;
}

export interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'bank_transfer' | 'paypal' | 'stripe';
  reference: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface DashboardStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalReferrals: number;
  totalEarnings: number;
  pendingPayouts: number;
  monthlyGrowth: number;
}

export interface Integration {
  id: string;
  name: string;
  type: 'sharetribe' | 'shopify' | 'woocommerce' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
