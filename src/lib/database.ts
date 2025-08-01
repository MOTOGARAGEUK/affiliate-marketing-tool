import { createServerClient } from './supabase';
import type { Tables, InsertDto, UpdateDto } from './supabase';

// Get server client for database operations (singleton)
const getSupabase = () => createServerClient();

// Programs API
export const programsAPI = {
  async getAll(userId: string) {
    const { data, error } = await getSupabase()
      .from('programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string, userId: string) {
    const { data, error } = await getSupabase()
      .from('programs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(program: InsertDto<'programs'>) {
    const { data, error } = await getSupabase()
      .from('programs')
      .insert(program)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateDto<'programs'>, userId: string) {
    const { data, error } = await getSupabase()
      .from('programs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string, userId: string) {
    const { error } = await getSupabase()
      .from('programs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
};

// Affiliates API
export const affiliatesAPI = {
  async getAll(userId: string) {
    const { data, error } = await getSupabase()
      .from('affiliates')
      .select(`
        *,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string, userId: string) {
    const { data, error } = await getSupabase()
      .from('affiliates')
      .select(`
        *,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(affiliate: InsertDto<'affiliates'>) {
    // Generate referral code if not provided
    if (!affiliate.referral_code) {
      const nameCode = affiliate.name.toUpperCase().replace(/\s+/g, '');
      const randomNum = Math.floor(Math.random() * 1000);
      affiliate.referral_code = `${nameCode}${randomNum}`;
    }

    // Generate referral link if not provided
    if (!affiliate.referral_link) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com';
      affiliate.referral_link = `${baseUrl}/ref/${affiliate.referral_code}`;
    }

    const { data, error } = await getSupabase()
      .from('affiliates')
      .insert(affiliate)
      .select(`
        *,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateDto<'affiliates'>, userId: string) {
    const { data, error } = await getSupabase()
      .from('affiliates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        programs (
          id,
          name,
          commission,
          commission_type,
          type
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string, userId: string) {
    console.log('=== DATABASE DELETE DEBUG ===');
    console.log('Deleting affiliate ID:', id);
    console.log('User ID:', userId);
    
    try {
      // First, delete related records to avoid foreign key constraint issues
      console.log('Deleting related referrals...');
      const { error: referralsError } = await getSupabase()
        .from('referrals')
        .delete()
        .eq('affiliate_id', id)
        .eq('user_id', userId);

      if (referralsError) {
        console.error('❌ Error deleting referrals:', referralsError);
        throw referralsError;
      }

      console.log('Deleting related payouts...');
      const { error: payoutsError } = await getSupabase()
        .from('payouts')
        .delete()
        .eq('affiliate_id', id)
        .eq('user_id', userId);

      if (payoutsError) {
        console.error('❌ Error deleting payouts:', payoutsError);
        throw payoutsError;
      }

      // Now delete the affiliate
      console.log('Deleting affiliate...');
      const { data, error } = await getSupabase()
        .from('affiliates')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('❌ Database delete error:', error);
        throw error;
      }
      
      console.log('✅ Database delete successful, rows affected:', data?.length || 0);
      console.log('=== END DATABASE DELETE DEBUG ===');
      return true;
    } catch (error) {
      console.error('❌ Error in delete operation:', error);
      console.log('=== END DATABASE DELETE DEBUG ===');
      throw error;
    }
  }
};

// Referrals API
export const referralsAPI = {
  async getAll(userId: string) {
    const { data, error } = await getSupabase()
      .from('referrals')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        ),
        programs (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string, userId: string) {
    const { data, error } = await getSupabase()
      .from('referrals')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        ),
        programs (
          id,
          name
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getByAffiliateId(affiliateId: string, userId: string) {
    const { data, error } = await getSupabase()
      .from('referrals')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        ),
        programs (
          id,
          name
        )
      `)
      .eq('affiliate_id', affiliateId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(referral: InsertDto<'referrals'>) {
    const { data, error } = await getSupabase()
      .from('referrals')
      .insert(referral)
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        ),
        programs (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;

    // Update affiliate stats
    await this.updateAffiliateStats(referral.affiliate_id, referral.user_id);

    return data;
  },

  async update(id: string, updates: UpdateDto<'referrals'>, userId: string) {
    const { data, error } = await getSupabase()
      .from('referrals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        ),
        programs (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateAffiliateStats(affiliateId: string, userId: string) {
    // Get all referrals for this affiliate
    const { data: referrals, error: referralsError } = await getSupabase()
      .from('referrals')
      .select('commission, status')
      .eq('affiliate_id', affiliateId)
      .eq('user_id', userId);

    if (referralsError) throw referralsError;

    // Calculate totals
    const totalReferrals = referrals.length;
    const totalEarnings = referrals
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + Number(r.commission), 0);

    // Update affiliate
    const { error: updateError } = await getSupabase()
      .from('affiliates')
      .update({
        total_referrals: totalReferrals,
        total_earnings: totalEarnings
      })
      .eq('id', affiliateId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  }
};

// Payouts API
export const payoutsAPI = {
  async getAll(userId: string) {
    const { data, error } = await getSupabase()
      .from('payouts')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string, userId: string) {
    const { data, error } = await getSupabase()
      .from('payouts')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getByAffiliateId(affiliateId: string, userId: string) {
    const { data, error } = await getSupabase()
      .from('payouts')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        )
      `)
      .eq('affiliate_id', affiliateId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(payout: InsertDto<'payouts'>) {
    const { data, error } = await getSupabase()
      .from('payouts')
      .insert(payout)
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateDto<'payouts'>, userId: string) {
    const { data, error } = await getSupabase()
      .from('payouts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }
};

// Dashboard API
export const dashboardAPI = {
  async getStats(userId: string, fromDate?: Date) {
    const baseQuery = fromDate ? 
      getSupabase().from('affiliates').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', fromDate.toISOString()) :
      getSupabase().from('affiliates').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    const activeQuery = fromDate ?
      getSupabase().from('affiliates').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active').gte('created_at', fromDate.toISOString()) :
      getSupabase().from('affiliates').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active');

    const referralsQuery = fromDate ?
      getSupabase().from('referrals').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', fromDate.toISOString()) :
      getSupabase().from('referrals').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    const pendingReferralsQuery = fromDate ?
      getSupabase().from('referrals').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending').gte('created_at', fromDate.toISOString()) :
      getSupabase().from('referrals').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending');

    const affiliatesQuery = fromDate ?
      getSupabase().from('affiliates').select('total_earnings').eq('user_id', userId).gte('created_at', fromDate.toISOString()) :
      getSupabase().from('affiliates').select('total_earnings').eq('user_id', userId);

    const payoutsQuery = fromDate ?
      getSupabase().from('payouts').select('amount').eq('user_id', userId).gte('created_at', fromDate.toISOString()) :
      getSupabase().from('payouts').select('amount').eq('user_id', userId);

    const [
      { count: totalAffiliates },
      { count: activeAffiliates },
      { count: totalReferrals },
      { count: pendingReferrals },
      { data: affiliates },
      { data: payouts }
    ] = await Promise.all([
      baseQuery,
      activeQuery,
      referralsQuery,
      pendingReferralsQuery,
      affiliatesQuery,
      payoutsQuery
    ]);

    const totalEarnings = affiliates?.reduce((sum, a) => sum + Number(a.total_earnings || 0), 0) || 0;
    const totalPayouts = payouts?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    return {
      totalAffiliates: totalAffiliates || 0,
      activeAffiliates: activeAffiliates || 0,
      totalReferrals: totalReferrals || 0,
      pendingReferrals: pendingReferrals || 0,
      totalEarnings,
      totalPayouts,
      pendingPayouts: totalEarnings - totalPayouts
    };
  },

  async getChartData(userId: string) {
    // Get data for the last 6 months
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        startDate: date.toISOString(),
        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()
      });
    }

    const chartData = await Promise.all(
      months.map(async (month) => {
        const [referralsResult, earningsResult] = await Promise.all([
          getSupabase()
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', month.startDate)
            .lt('created_at', month.endDate),
          
          getSupabase()
            .from('referrals')
            .select('commission_earned')
            .eq('user_id', userId)
            .gte('created_at', month.startDate)
            .lt('created_at', month.endDate)
        ]);

        const referrals = referralsResult.count || 0;
        const earnings = earningsResult.data?.reduce((sum, r) => sum + Number(r.commission_earned || 0), 0) || 0;

        return {
          month: month.month,
          referrals,
          earnings
        };
      })
    );

    return chartData;
  },

  async getRecentActivity(userId: string) {
    const { data, error } = await getSupabase()
      .from('referrals')
      .select(`
        *,
        affiliates (
          id,
          name,
          email
        ),
        programs (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  }
};

// Integrations API
export const integrationsAPI = {
  async getAll(userId: string) {
    const { data, error } = await getSupabase()
      .from('integrations')
      .select('id, name, type, status, config, user_id, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string, userId: string) {
    const { data, error } = await getSupabase()
      .from('integrations')
      .select('id, name, type, status, config, user_id, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(integration: InsertDto<'integrations'>) {
    const { data, error } = await getSupabase()
      .from('integrations')
      .insert(integration)
      .select('id, name, type, status, config, user_id, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateDto<'integrations'>, userId: string) {
    const { data, error } = await getSupabase()
      .from('integrations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, name, type, status, config, user_id, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string, userId: string) {
    const { error } = await getSupabase()
      .from('integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
}; 