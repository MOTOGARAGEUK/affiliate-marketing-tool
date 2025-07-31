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
  programId: string; // Reference to the program this affiliate is assigned to
  totalEarnings: number;
  totalReferrals: number;
  referralCode: string;
  referralLink: string;
  createdAt: string;
  updatedAt: string;
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
