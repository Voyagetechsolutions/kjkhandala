// Multi-currency support for KJ Khandala
// Supports USD, BWP (Pula), and ZAR (Rand)

export type Currency = 'USD' | 'BWP' | 'ZAR';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
  },
  BWP: {
    code: 'BWP',
    symbol: 'P',
    name: 'Botswana Pula',
    flag: '🇧🇼',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    flag: '🇿🇦',
  },
};

// Exchange rates relative to BWP (Pula) - Update these regularly
// These are approximate rates as of 2024
const EXCHANGE_RATES: Record<Currency, number> = {
  BWP: 1.0,      // Base currency
  USD: 0.073,    // 1 BWP = 0.073 USD
  ZAR: 1.35,     // 1 BWP = 1.35 ZAR
};

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to BWP first (base currency)
  const amountInBWP = amount / EXCHANGE_RATES[fromCurrency];
  
  // Then convert to target currency
  const convertedAmount = amountInBWP * EXCHANGE_RATES[toCurrency];
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const currencyInfo = CURRENCIES[currency];
  return `${currencyInfo.symbol}${amount.toFixed(2)}`;
}

/**
 * Get currency from local storage or default to BWP
 */
export function getSelectedCurrency(): Currency {
  if (typeof window === 'undefined') return 'BWP';
  
  const stored = localStorage.getItem('selectedCurrency');
  if (stored && (stored === 'USD' || stored === 'BWP' || stored === 'ZAR')) {
    return stored as Currency;
  }
  return 'BWP';
}

/**
 * Save selected currency to local storage
 */
export function setSelectedCurrency(currency: Currency): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('selectedCurrency', currency);
  }
}

/**
 * Get all available currencies
 */
export function getAllCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCIES);
}

/**
 * Update exchange rates (call this from an API in production)
 */
export function updateExchangeRates(rates: Partial<Record<Currency, number>>): void {
  Object.assign(EXCHANGE_RATES, rates);
}

/**
 * Get current exchange rate between two currencies
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  if (from === to) return 1;
  return EXCHANGE_RATES[to] / EXCHANGE_RATES[from];
}
