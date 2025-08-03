'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AffiliateProtectedRouteProps {
  children: React.ReactNode;
}

export default function AffiliateProtectedRoute({ children }: AffiliateProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAffiliateStatus = async () => {
      if (authLoading) return;

      if (!user) {
        router.push('/affiliate/login');
        return;
      }

      try {
        // Check if user is an affiliate
        const { data: affiliate, error } = await supabase()
          .from('affiliates')
          .select('id, status')
          .eq('email', user.email)
          .single();

        if (error || !affiliate) {
          console.log('User is not an affiliate, redirecting to login');
          router.push('/affiliate/login');
          return;
        }

        if (affiliate.status !== 'active') {
          console.log('Affiliate account is not active');
          router.push('/affiliate/login');
          return;
        }

        setIsAffiliate(true);
      } catch (error) {
        console.error('Error checking affiliate status:', error);
        router.push('/affiliate/login');
      } finally {
        setLoading(false);
      }
    };

    checkAffiliateStatus();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAffiliate) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
} 