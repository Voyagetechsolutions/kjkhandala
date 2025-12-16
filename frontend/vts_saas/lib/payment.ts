// DPO PayGate Integration for KJ Khandala
// Documentation: https://www.dpogroup.com/documentation/

import { Currency } from './currency';

export interface PaymentRequest {
  amount: number;
  currency: Currency;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
}

export interface DPOPaymentResponse {
  success: boolean;
  transToken?: string;
  transRef?: string;
  redirectUrl?: string;
  error?: string;
}

// DPO PayGate Configuration
const DPO_CONFIG = {
  companyToken: import.meta.env.VITE_DPO_COMPANY_TOKEN || 'YOUR_COMPANY_TOKEN',
  serviceType: import.meta.env.VITE_DPO_SERVICE_TYPE || '3854',
  paymentUrl: import.meta.env.VITE_DPO_PAYMENT_URL || 'https://secure.3gdirectpay.com',
  apiUrl: import.meta.env.VITE_DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/',
};

/**
 * Create a payment token with DPO PayGate
 */
export async function createPaymentToken(request: PaymentRequest): Promise<DPOPaymentResponse> {
  try {
    // Map currency codes to DPO format
    const currencyMap: Record<Currency, string> = {
      BWP: 'BWP',
      USD: 'USD',
      ZAR: 'ZAR',
    };

    // Create XML request for DPO
    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${DPO_CONFIG.companyToken}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${request.amount.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>${currencyMap[request.currency]}</PaymentCurrency>
    <CompanyRef>${request.reference}</CompanyRef>
    <RedirectURL>${window.location.origin}/payment/callback</RedirectURL>
    <BackURL>${window.location.origin}/payment/cancel</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>5</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${DPO_CONFIG.serviceType}</ServiceType>
      <ServiceDescription>${request.description}</ServiceDescription>
      <ServiceDate>${new Date().toISOString().split('T')[0]}</ServiceDate>
    </Service>
  </Services>
  <Additional>
    <CustomerFirstName>${request.customerName.split(' ')[0]}</CustomerFirstName>
    <CustomerLastName>${request.customerName.split(' ').slice(1).join(' ') || 'Customer'}</CustomerLastName>
    <CustomerEmail>${request.customerEmail}</CustomerEmail>
    <CustomerPhone>${request.customerPhone}</CustomerPhone>
  </Additional>
</API3G>`;

    // In production, this should go through your backend
    // For now, we'll simulate the response
    const response = await fetch(`${DPO_CONFIG.apiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlRequest,
    });

    const xmlResponse = await response.text();
    
    // Parse XML response (simplified - use proper XML parser in production)
    const transToken = xmlResponse.match(/<TransToken>(.*?)<\/TransToken>/)?.[1];
    const transRef = xmlResponse.match(/<TransRef>(.*?)<\/TransRef>/)?.[1];
    const resultCode = xmlResponse.match(/<Result>(.*?)<\/Result>/)?.[1];

    if (resultCode === '000' && transToken) {
      return {
        success: true,
        transToken,
        transRef,
        redirectUrl: `${DPO_CONFIG.paymentUrl}/payv2.php?ID=${transToken}`,
      };
    }

    return {
      success: false,
      error: 'Failed to create payment token',
    };
  } catch (error) {
    console.error('Payment token creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify payment status with DPO
 */
export async function verifyPayment(transToken: string): Promise<{
  success: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  reference?: string;
}> {
  try {
    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${DPO_CONFIG.companyToken}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${transToken}</TransactionToken>
</API3G>`;

    const response = await fetch(`${DPO_CONFIG.apiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlRequest,
    });

    const xmlResponse = await response.text();
    
    const resultCode = xmlResponse.match(/<Result>(.*?)<\/Result>/)?.[1];
    const resultExplanation = xmlResponse.match(/<ResultExplanation>(.*?)<\/ResultExplanation>/)?.[1];

    return {
      success: resultCode === '000',
      status: resultExplanation,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
    };
  }
}

/**
 * Process payment (simplified for demo - use backend in production)
 */
export async function processPayment(request: PaymentRequest): Promise<DPOPaymentResponse> {
  // For demo purposes, simulate payment processing
  // In production, this MUST go through your secure backend
  
  const isDemoMode = !DPO_CONFIG.companyToken || DPO_CONFIG.companyToken === 'YOUR_COMPANY_TOKEN';
  
  if (isDemoMode) {
    // Demo mode - simulate successful payment
    return {
      success: true,
      transToken: `DEMO_${Date.now()}`,
      transRef: request.reference,
      redirectUrl: '/payment/success',
    };
  }

  // Production mode - use real DPO PayGate
  return await createPaymentToken(request);
}

/**
 * Get payment methods available for currency
 */
export function getAvailablePaymentMethods(currency: Currency): string[] {
  const methods: Record<Currency, string[]> = {
    BWP: ['Card', 'Mobile Money', 'Bank Transfer'],
    USD: ['Card', 'PayPal'],
    ZAR: ['Card', 'EFT', 'Instant EFT'],
  };
  
  return methods[currency] || ['Card'];
}
