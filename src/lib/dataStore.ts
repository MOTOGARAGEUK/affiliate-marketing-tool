// Centralized data store for the application
// In a production app, this would be replaced with a database

export interface Program {
  id: string;
  name: string;
  type: 'signup' | 'purchase';
  commission: number;
  commissionType: 'fixed' | 'percentage';
  status: 'active' | 'inactive';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'inactive';
  programId: string;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  affiliateId: string;
  programId: string;
  customerEmail: string;
  customerName: string;
  status: 'pending' | 'approved' | 'rejected';
  commission: number;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  method: 'bank' | 'paypal' | 'stripe';
  reference: string;
  createdAt: string;
  paidAt?: string;
}

// In-memory data store
let dataStore = {
  programs: [
    {
      id: '1',
      name: 'Sign Up Referrals',
      type: 'signup' as const,
      commission: 25,
      commissionType: 'fixed' as const,
      status: 'active' as const,
      description: 'Earn $25 for each new user signup',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Purchase Referrals',
      type: 'purchase' as const,
      commission: 10,
      commissionType: 'percentage' as const,
      status: 'active' as const,
      description: 'Earn 10% commission on all purchases',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ] as Program[],
  
  affiliates: [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+1234567890',
      status: 'active' as const,
      programId: '1',
      referralCode: 'JOHN25',
      referralLink: 'https://marketplace.com/ref/JOHN25',
      totalReferrals: 12,
      totalEarnings: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1987654321',
      status: 'active' as const,
      programId: '2',
      referralCode: 'SARAH10',
      referralLink: 'https://marketplace.com/ref/SARAH10',
      totalReferrals: 8,
      totalEarnings: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ] as Affiliate[],
  
  referrals: [
    {
      id: '1',
      affiliateId: '1',
      programId: '1',
      customerEmail: 'customer1@example.com',
      customerName: 'Customer One',
      status: 'approved' as const,
      commission: 25,
      referralCode: 'JOHN25',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      affiliateId: '2',
      programId: '2',
      customerEmail: 'customer2@example.com',
      customerName: 'Customer Two',
      status: 'pending' as const,
      commission: 15,
      referralCode: 'SARAH10',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ] as Referral[],
  
  payouts: [
    {
      id: '1',
      affiliateId: '1',
      amount: 300,
      status: 'paid' as const,
      method: 'paypal' as const,
      reference: 'PAY-001',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    },
    {
      id: '2',
      affiliateId: '2',
      amount: 150,
      status: 'pending' as const,
      method: 'bank' as const,
      reference: 'PAY-002',
      createdAt: new Date().toISOString(),
    }
  ] as Payout[],
};

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Programs CRUD operations
export const programsAPI = {
  getAll: () => dataStore.programs,
  
  getById: (id: string) => dataStore.programs.find(p => p.id === id),
  
  create: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProgram: Program = {
      ...program,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dataStore.programs.push(newProgram);
    return newProgram;
  },
  
  update: (id: string, updates: Partial<Omit<Program, 'id' | 'createdAt'>>) => {
    const index = dataStore.programs.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    dataStore.programs[index] = {
      ...dataStore.programs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return dataStore.programs[index];
  },
  
  delete: (id: string) => {
    const index = dataStore.programs.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    dataStore.programs.splice(index, 1);
    return true;
  }
};

// Affiliates CRUD operations
export const affiliatesAPI = {
  getAll: () => dataStore.affiliates,
  
  getById: (id: string) => dataStore.affiliates.find(a => a.id === id),
  
  create: (affiliate: Omit<Affiliate, 'id' | 'referralCode' | 'referralLink' | 'totalReferrals' | 'totalEarnings' | 'createdAt' | 'updatedAt'>) => {
    const referralCode = `${affiliate.name.toUpperCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`;
    const referralLink = `https://marketplace.com/ref/${referralCode}`;
    
    const newAffiliate: Affiliate = {
      ...affiliate,
      id: generateId(),
      referralCode,
      referralLink,
      totalReferrals: 0,
      totalEarnings: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dataStore.affiliates.push(newAffiliate);
    return newAffiliate;
  },
  
  update: (id: string, updates: Partial<Omit<Affiliate, 'id' | 'createdAt'>>) => {
    const index = dataStore.affiliates.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    dataStore.affiliates[index] = {
      ...dataStore.affiliates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return dataStore.affiliates[index];
  },
  
  delete: (id: string) => {
    const index = dataStore.affiliates.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    dataStore.affiliates.splice(index, 1);
    return true;
  }
};

// Referrals CRUD operations
export const referralsAPI = {
  getAll: () => dataStore.referrals,
  
  getById: (id: string) => dataStore.referrals.find(r => r.id === id),
  
  getByAffiliateId: (affiliateId: string) => dataStore.referrals.filter(r => r.affiliateId === affiliateId),
  
  create: (referral: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReferral: Referral = {
      ...referral,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dataStore.referrals.push(newReferral);
    
    // Update affiliate stats
    const affiliate = dataStore.affiliates.find(a => a.id === referral.affiliateId);
    if (affiliate) {
      affiliate.totalReferrals += 1;
      affiliate.totalEarnings += referral.commission;
      affiliate.updatedAt = new Date().toISOString();
    }
    
    return newReferral;
  },
  
  update: (id: string, updates: Partial<Omit<Referral, 'id' | 'createdAt'>>) => {
    const index = dataStore.referrals.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    dataStore.referrals[index] = {
      ...dataStore.referrals[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return dataStore.referrals[index];
  }
};

// Payouts CRUD operations
export const payoutsAPI = {
  getAll: () => dataStore.payouts,
  
  getById: (id: string) => dataStore.payouts.find(p => p.id === id),
  
  getByAffiliateId: (affiliateId: string) => dataStore.payouts.filter(p => p.affiliateId === affiliateId),
  
  create: (payout: Omit<Payout, 'id' | 'createdAt'>) => {
    const newPayout: Payout = {
      ...payout,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    dataStore.payouts.push(newPayout);
    return newPayout;
  },
  
  update: (id: string, updates: Partial<Omit<Payout, 'id' | 'createdAt'>>) => {
    const index = dataStore.payouts.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    dataStore.payouts[index] = {
      ...dataStore.payouts[index],
      ...updates,
    };
    return dataStore.payouts[index];
  }
};

// Dashboard statistics
export const dashboardAPI = {
  getStats: () => {
    const totalAffiliates = dataStore.affiliates.length;
    const activeAffiliates = dataStore.affiliates.filter(a => a.status === 'active').length;
    const totalReferrals = dataStore.referrals.length;
    const pendingReferrals = dataStore.referrals.filter(r => r.status === 'pending').length;
    const totalEarnings = dataStore.affiliates.reduce((sum, a) => sum + a.totalEarnings, 0);
    const totalPayouts = dataStore.payouts.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalAffiliates,
      activeAffiliates,
      totalReferrals,
      pendingReferrals,
      totalEarnings,
      totalPayouts,
      pendingPayouts: totalEarnings - totalPayouts
    };
  },
  
  getRecentActivity: () => {
    const allItems = [
      ...dataStore.referrals.map(r => ({ ...r, type: 'referral' as const })),
      ...dataStore.payouts.map(p => ({ ...p, type: 'payout' as const })),
      ...dataStore.affiliates.map(a => ({ ...a, type: 'affiliate' as const }))
    ];
    
    return allItems
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }
}; 