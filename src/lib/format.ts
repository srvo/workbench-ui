import { format, formatDistanceToNow } from 'date-fns';

// Number formatting
export const formatPercent = (value: number | null | undefined, decimals = 2): string => {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

export const formatNumber = (value: number | null | undefined, decimals = 0): string => {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Date formatting
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return '—';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return format(new Date(date), 'MMM d, yyyy HH:mm');
  } catch {
    return '—';
  }
};

export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '—';
  }
};

// Ticker formatting
export const formatTicker = (symbol: string): string => {
  return symbol.toUpperCase().replace(/[^A-Z0-9-]/g, '');
};