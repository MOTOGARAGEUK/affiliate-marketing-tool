import { v4 as uuidv4 } from 'uuid';

export function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${randomSuffix}`;
}

export function generateReferralLink(baseUrl: string, referralCode: string): string {
  return `${baseUrl}/ref/${referralCode}`;
}

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  const currencySymbols: { [key: string]: string } = {
    'GBP': '£',
    'USD': '$',
    'EUR': '€',
    'CAD': 'C$',
    'AUD': 'A$'
  };

  const symbol = currencySymbols[currency] || '£';
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Legacy function for backward compatibility
export function formatCurrencyUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle different date string formats
      if (date.includes('T') || date.includes('Z')) {
        // ISO string format
        dateObj = new Date(date);
      } else if (date.includes('-')) {
        // Date only format (YYYY-MM-DD)
        dateObj = new Date(date + 'T00:00:00');
      } else {
        // Try parsing as is
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date received:', date);
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return 'Invalid date';
  }
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

// Calculate percentage change between two values
export function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}
