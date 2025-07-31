'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from './Layout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Pages that should not have the sidebar
  const publicPages = ['/login', '/signup', '/auth/callback'];
  const isPublicPage = publicPages.includes(pathname);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // For public pages (login, signup), render without sidebar
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For authenticated pages, render with sidebar
  return <Layout>{children}</Layout>;
} 