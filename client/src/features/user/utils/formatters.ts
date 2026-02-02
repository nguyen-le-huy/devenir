/**
 * User Utils - Formatters
 * Utility functions for formatting user data
 */

import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

/**
 * Format date to readable string
 * @param dateString ISO date string or Date object
 * @param formatString Custom format (default: 'MM/dd/yyyy')
 */
export const formatDate = (
  dateString: string | Date | null | undefined,
  formatString = 'MM/dd/yyyy'
): string => {
  if (!dateString) return '—';

  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatString, { locale: enUS });
  } catch {
    console.error('Invalid date format:', dateString);
    return '—';
  }
};

/**
 * Format date with time
 * @param dateString ISO date string or Date object
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  return formatDate(dateString, 'MM/dd/yyyy HH:mm');
};

/**
 * Format phone number to readable format
 * @param phone Raw phone number
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '—';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Vietnamese phone format
  if (cleaned.startsWith('84')) {
    // +84 xxx xxx xxx
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  } else if (cleaned.startsWith('0')) {
    // 0xxx xxx xxx
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Format currency (USD)
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get user's full name
 */
export const getFullName = (firstName?: string, lastName?: string): string => {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '';
};

/**
 * Get user's display name (fallback chain)
 */
export const getDisplayName = (
  username?: string,
  email?: string,
  firstName?: string,
  lastName?: string
): string => {
  const fullName = getFullName(firstName, lastName);
  if (fullName) return fullName;
  if (username) return username;
  if (email) return email.split('@')[0];
  return 'User';
};

/**
 * Mask email for privacy
 * Example: john.doe@example.com -> j***e@example.com
 */
export const maskEmail = (email: string | null | undefined): string => {
  if (!email) return '—';

  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
};

/**
 * Mask phone for privacy
 * Example: +84 123 456 789 -> +84 *** *** 789
 */
export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—';

  const cleaned = phone.replace(/\D/g, '');
  const lastFour = cleaned.slice(-4);

  if (cleaned.startsWith('84')) {
    return `+84 *** *** ${lastFour}`;
  }

  return `*** *** ${lastFour}`;
};
