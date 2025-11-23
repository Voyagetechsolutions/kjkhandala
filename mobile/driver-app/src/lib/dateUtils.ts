import { format as dateFnsFormat } from 'date-fns';

/**
 * Safely formats a date string. Returns 'N/A' if the date is invalid.
 * @param dateString - The date string to format
 * @param formatString - The format pattern (e.g., 'HH:mm', 'MMM dd, yyyy')
 * @returns Formatted date string or 'N/A' if invalid
 */
export function safeFormatDate(dateString: string | null | undefined, formatString: string): string {
  if (!dateString) {
    return 'N/A';
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return dateFnsFormat(date, formatString);
  } catch (error) {
    console.warn('Invalid date format:', dateString, error);
    return 'N/A';
  }
}

/**
 * Checks if a date string is valid
 * @param dateString - The date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) {
    return false;
  }

  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
