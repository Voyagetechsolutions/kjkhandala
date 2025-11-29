/**
 * DPO Pay Payment Types
 * TypeScript definitions for payment operations
 */

// ===========================
// Payment Status Types
// ===========================

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod = 'card' | 'mobile_money' | 'bank_transfer' | 'cash';

export type Currency = 'BWP' | 'ZAR' | 'USD' | 'KES' | 'TZS';

// ===========================
// DPO Result Codes
// ===========================

export type DPOResultCode =
  | '000' // Transaction paid
  | '001' // Authorized
  | '002' // Transaction overpaid/underpaid
  | '003' // Pending Bank
  | '005' // Queued Authorization
  | '007' // Pending Split Payment
  | '800' // Transaction not authorized
  | '801' // Request missing company token
  | '802' // Company token does not exist
  | '803' // Invalid request type
  | '804' // Error in XML
  | '900' // Transaction not paid yet
  | '901' // Transaction declined
  | '902' // Data mismatch
  | '903' // Payment Time Limit exceeded
  | '904' // Transaction cancelled
  | '905' // Amount exceeded limit;

// ===========================
// Payment Request/Response Types
// ===========================

export interface InitializePaymentRequest {
  bookingId: string;
  amount: number;
  currency?: Currency;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
}

export interface InitializePaymentResponse {
  success: boolean;
  paymentId: string;
  transToken: string;
  transRef: string;
  paymentURL: string;
  companyRef: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status: PaymentStatus;
  result: DPOResultCode;
  resultExplanation: string;
  payment: Payment;
}

export interface MobilePaymentOption {
  country: string;
  countryCode: string;
  paymentname: string;
  logo: string;
  cellularprefix: string;
  amount: number;
  currency: string;
  instructions: string;
}

export interface ChargeMobileRequest {
  transToken: string;
  phoneNumber: string;
  mno: string;
  mnoCountry: string;
}

export interface ChargeMobileResponse {
  success: boolean;
  statusCode: string;
  instructions?: string;
  redirectOption?: boolean;
}

export interface BankOption {
  bankName: string;
  bankCode: string;
  instructions: {
    bankInstructionsEN?: string;
    bankInstructionsIT?: string;
    bankInstructionsFR?: string;
    bankInstructionsSW?: string;
  };
}

export interface ChargeBankTransferRequest {
  transToken: string;
  bankCode: string;
}

export interface ChargeBankTransferResponse {
  success: boolean;
  message: string;
  convertedAmount?: number;
  convertedCurrency?: string;
}

export interface RefundPaymentRequest {
  refundAmount: number;
  refundReason: string;
  userId?: string;
}

export interface RefundPaymentResponse {
  success: boolean;
  message: string;
  refundAmount: number;
}

// ===========================
// Payment Entity Types
// ===========================

export interface Payment {
  id: string;
  booking_id: string;
  
  // DPO Transaction Details
  dpo_trans_token: string;
  dpo_trans_ref: string;
  dpo_company_ref: string;
  
  // Payment Information
  amount: number;
  currency: Currency;
  payment_method?: PaymentMethod;
  status: PaymentStatus;
  
  // Customer Details
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_country?: string;
  
  // Card Details (last 4 only)
  card_last4?: string;
  card_type?: string;
  
  // Transaction Details
  transaction_approval?: string;
  transaction_net_amount?: number;
  transaction_settlement_date?: string;
  
  // Fraud Detection
  fraud_alert?: string;
  fraud_explanation?: string;
  
  // Mobile Money Details
  mobile_network?: string;
  mobile_number?: string;
  mobile_instructions?: string;
  
  // Refund Information
  refund_amount?: number;
  refund_reason?: string;
  refund_date?: string;
  refunded_by?: string;
  
  // Metadata
  payment_date?: string;
  verified_at?: string;
  notes?: string;
  metadata?: Record<string, any>;
  
  // Audit
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PaymentAttempt {
  id: string;
  payment_id: string;
  booking_id: string;
  
  attempt_number: number;
  payment_method?: PaymentMethod;
  amount: number;
  currency: Currency;
  
  dpo_trans_token?: string;
  dpo_result_code?: string;
  dpo_result_explanation?: string;
  
  status: 'initiated' | 'success' | 'failed' | 'cancelled';
  error_message?: string;
  
  initiated_at: string;
  completed_at?: string;
  
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface PaymentWebhook {
  id: string;
  
  dpo_trans_token?: string;
  dpo_trans_ref?: string;
  dpo_company_ref?: string;
  
  webhook_type: 'payment_success' | 'payment_failed' | 'refund' | 'other';
  raw_payload: Record<string, any>;
  
  processed: boolean;
  processed_at?: string;
  processing_error?: string;
  
  received_at: string;
  ip_address?: string;
}

// ===========================
// Payment Analytics Types
// ===========================

export interface PaymentAnalytics {
  totalTransactions: number;
  totalRevenue: number;
  netRevenue: number;
  averageTransaction: number;
  byPaymentMethod: Record<string, {
    count: number;
    amount: number;
  }>;
  byCurrency: Record<string, {
    count: number;
    amount: number;
  }>;
}

export interface PaymentAnalyticsRequest {
  startDate?: string;
  endDate?: string;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
}

// ===========================
// Company Configuration
// ===========================

export interface CompanyMobilePaymentOption {
  terminalredirecturi: string;
  terminaltype: string;
  terminalmno: string;
  terminalmnocountry: string;
}

export interface DPOPayConfig {
  apiUrl: string;
  paymentUrl: string;
  isConfigured: boolean;
}

// ===========================
// Form State Types
// ===========================

export interface PaymentFormState {
  step: 'select' | 'details' | 'processing' | 'complete' | 'error';
  paymentMethod?: PaymentMethod;
  amount: number;
  currency: Currency;
  loading: boolean;
  error?: string;
  success?: boolean;
}

export interface MobilePaymentFormData {
  provider: string;
  phoneNumber: string;
  countryCode: string;
}

export interface BankTransferFormData {
  bankCode: string;
  bankName: string;
}

// ===========================
// Utility Types
// ===========================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===========================
// Error Types
// ===========================

export interface PaymentError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export class PaymentException extends Error {
  code: string;
  details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = 'PaymentException';
    this.code = code;
    this.details = details;
  }
}

// ===========================
// Constants
// ===========================

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Credit/Debit Card',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BWP: 'P',
  ZAR: 'R',
  USD: '$',
  KES: 'KSh',
  TZS: 'TSh',
};

export const DPO_RESULT_MESSAGES: Record<DPOResultCode, string> = {
  '000': 'Transaction paid successfully',
  '001': 'Transaction authorized',
  '002': 'Transaction amount mismatch',
  '003': 'Pending bank confirmation',
  '005': 'Authorization queued',
  '007': 'Pending split payment',
  '800': 'Transaction not authorized',
  '801': 'Invalid company token',
  '802': 'Company token does not exist',
  '803': 'Invalid request type',
  '804': 'XML parsing error',
  '900': 'Transaction not paid yet',
  '901': 'Transaction declined',
  '902': 'Data validation error',
  '903': 'Payment time limit exceeded',
  '904': 'Transaction cancelled',
  '905': 'Amount exceeds transaction limit',
};
