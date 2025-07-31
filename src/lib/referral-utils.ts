import { createClient } from '@supabase/supabase-js';

// Normalize URL to prevent double slashes
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  // Remove trailing slashes
  let normalized = url.replace(/\/+$/, '');
  
  // Ensure it starts with http/https
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
}

// Generate referral link with proper URL formatting
export function generateReferralLink(baseUrl: string, referralCode: string): string {
  const normalizedUrl = normalizeUrl(baseUrl);
  return `${normalizedUrl}/ref/${referralCode}`;
}

// Update all referral links for a user when marketplace URL changes
export async function updateAllReferralLinks(userId: string, newMarketplaceUrl: string, supabaseToken: string) {
  try {
    console.log('Updating all referral links for user:', userId);
    console.log('New marketplace URL:', newMarketplaceUrl);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${supabaseToken}`,
          },
        },
      }
    );

    // Get all affiliates for this user
    const { data: affiliates, error: fetchError } = await supabase
      .from('affiliates')
      .select('id, referral_code, referral_link')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching affiliates:', fetchError);
      throw fetchError;
    }

    if (!affiliates || affiliates.length === 0) {
      console.log('No affiliates found for user');
      return { success: true, updated: 0 };
    }

    console.log(`Found ${affiliates.length} affiliates to update`);

    // Update each affiliate's referral link
    const updatePromises = affiliates.map(async (affiliate) => {
      if (!affiliate.referral_code) {
        console.log(`Skipping affiliate ${affiliate.id} - no referral code`);
        return null;
      }

      const newReferralLink = generateReferralLink(newMarketplaceUrl, affiliate.referral_code);
      
      console.log(`Updating affiliate ${affiliate.id}:`);
      console.log(`  Old link: ${affiliate.referral_link}`);
      console.log(`  New link: ${newReferralLink}`);

      const { error: updateError } = await supabase
        .from('affiliates')
        .update({ referral_link: newReferralLink })
        .eq('id', affiliate.id);

      if (updateError) {
        console.error(`Error updating affiliate ${affiliate.id}:`, updateError);
        throw updateError;
      }

      return affiliate.id;
    });

    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter(id => id !== null).length;

    console.log(`Successfully updated ${updatedCount} referral links`);

    return {
      success: true,
      updated: updatedCount,
      total: affiliates.length
    };

  } catch (error) {
    console.error('Error updating referral links:', error);
    throw error;
  }
} 