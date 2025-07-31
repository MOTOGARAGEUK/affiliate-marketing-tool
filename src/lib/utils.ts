import { v4 as uuidv4 } from 'uuid';

export function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${randomSuffix}`;
}

export function generateReferralLink(baseUrl: string, referralCode: string): string {
  return `${baseUrl}/ref/${referralCode}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function calculateCommission(amount: number, rate: number, type: 'percentage' | 'fixed'): number {
  if (type === 'fixed') {
    return rate;
  }
  return (amount * rate) / 100;
}

export function generateId(): string {
  return uuidv4();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'completed':
    case 'approved':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'inactive':
    case 'rejected':
    case 'failed':
      return 'text-red-600 bg-red-100';
    case 'processing':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}
