'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CaptureReferral() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const referralCode = searchParams.get('ref');
    
    if (referralCode) {
      // Store the referral code in localStorage and cookies
      localStorage.setItem('referralCode', referralCode);
      
      // Set cookie that expires in 30 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `referralCode=${referralCode}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      
      console.log('Referral code captured:', referralCode);
    }

    // Redirect to the signup page without the referral code
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('ref');
    
    // Redirect to the clean signup URL
    router.replace(currentUrl.toString());
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your referral...</p>
      </div>
    </div>
  );
} 