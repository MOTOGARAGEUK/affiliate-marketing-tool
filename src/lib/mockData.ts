import { Program, Affiliate, Referral, Payout, DashboardStats, Integration } from '@/types';

export const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'New User Signup',
    type: 'signup',
    commission: 10,
    commissionType: 'fixed',
    status: 'active',
    description: 'Earn $10 for every new user that signs up through your referral link',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'First Purchase',
    type: 'purchase',
    commission: 15,
    commissionType: 'percentage',
    status: 'active',
    description: 'Earn 15% commission on the first purchase made by referred users',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

export const mockAffiliates: Affiliate[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    status: 'active',
    programId: '1', // Assigned to New User Signup program
    totalEarnings: 1250,
    totalReferrals: 45,
    referralCode: 'JOHN123',
    referralLink: 'https://marketplace.com/ref/JOHN123',
    joinedAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'active',
    programId: '2', // Assigned to First Purchase program
    totalEarnings: 890,
    totalReferrals: 32,
    referralCode: 'JANE456',
    referralLink: 'https://marketplace.com/ref/JANE456',
    joinedAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

export const mockReferrals: Referral[] = [
  {
    id: '1',
    affiliateId: '1',
    programId: '1',
    customerEmail: 'customer1@example.com',
    customerName: 'Alice Johnson',
    commission: 10,
    status: 'approved',
    type: 'signup',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    affiliateId: '1',
    programId: '2',
    customerEmail: 'customer2@example.com',
    customerName: 'Bob Wilson',
    amount: 150,
    commission: 22.5,
    status: 'pending',
    type: 'purchase',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
];

export const mockPayouts: Payout[] = [
  {
    id: '1',
    affiliateId: '1',
    amount: 500,
    status: 'completed',
    method: 'bank_transfer',
    reference: 'PAY-001',
    createdAt: new Date('2024-01-15'),
    processedAt: new Date('2024-01-16'),
  },
  {
    id: '2',
    affiliateId: '2',
    amount: 300,
    status: 'pending',
    method: 'paypal',
    reference: 'PAY-002',
    createdAt: new Date('2024-01-20'),
  },
];

export const mockDashboardStats: DashboardStats = {
  totalAffiliates: 45,
  activeAffiliates: 38,
  totalReferrals: 234,
  totalEarnings: 12500,
  pendingPayouts: 3200,
  monthlyGrowth: 12.5,
};

export const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Sharetribe Marketplace',
    type: 'sharetribe',
    status: 'connected',
    config: {
      marketplaceId: 'marketplace-123',
      apiKey: 'sk_...',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];
