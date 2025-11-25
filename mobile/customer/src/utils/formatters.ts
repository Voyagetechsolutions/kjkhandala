import { format, parseISO } from 'date-fns';

/**
 * Format date to DD-MM-YYYY
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd-MM-yyyy');
  } catch (error) {
    return dateString;
  }
};

/**
 * Format time to HH:MM
 */
export const formatTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'HH:mm');
  } catch (error) {
    return dateString;
  }
};

/**
 * Calculate duration between two dates
 */
export const calculateDuration = (departure: string, arrival: string): string => {
  try {
    const dep = parseISO(departure);
    const arr = parseISO(arrival);
    const diff = arr.getTime() - dep.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'P0.00';
  }
  return `P${amount.toFixed(2)}`;
};
