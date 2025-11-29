import axios from 'axios';
import { parseStringPromise, Builder } from 'xml2js';

/**
 * DPO Pay API v6 Service
 * Clean implementation following DPO Pay documentation
 * https://www.dpogroup.com/documentation/
 */

// ===========================
// Configuration
// ===========================
const DPO_API_URL = process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/';
const DPO_COMPANY_TOKEN = process.env.DPO_COMPANY_TOKEN || '';
const DPO_PAYMENT_URL = process.env.DPO_PAYMENT_URL || 'https://secure.3gdirectpay.com';

// ===========================
// Type Definitions
// ===========================

// Basic Transaction Operations
interface CreateTokenParams {
  paymentAmount: number;
  paymentCurrency: string;
  companyRef: string;
  redirectURL: string;
  backURL: string;
  companyRefUnique?: '0' | '1'; // 0=can be reused, 1=unique
  ptl?: string; // Payment Time Limit in days (default: 5)
  
  // Customer Details
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  customerDialCode?: string;
  customerZip?: string;
  
  // Service Details
  serviceType: string;
  serviceDescription: string;
  serviceDate: string;
  
  // Optional fields
  companyAccRef?: string;
  userToken?: string;
}

interface CreateTokenResponse {
  result: string;
  resultExplanation: string;
  transToken?: string;
  transRef?: string;
  allocationId?: string;
  allocationCode?: string;
}

interface VerifyTokenParams {
  transactionToken?: string;
  companyRef?: string;
  verifyTransaction?: boolean; // Default true
  accRef?: string;
  customerPhone?: string;
  customerPhonePrefix?: string;
  customerEmail?: string;
}

interface VerifyTokenResponse {
  result: string;
  resultExplanation: string;
  customerName?: string;
  customerCredit?: string;
  customerCreditType?: string;
  transactionApproval?: string;
  transactionCurrency?: string;
  transactionAmount?: number;
  fraudAlert?: string;
  fraudExplanation?: string;
  transactionNetAmount?: number;
  transactionSettlementDate?: string;
  transactionRollingReserveAmount?: number;
  transactionRollingReserveDate?: string;
  customerPhone?: string;
  customerCountry?: string;
  customerAddress?: string;
  customerCity?: string;
  customerZip?: string;
  mobilePaymentRequest?: string;
  accRef?: string;
}

interface UpdateTokenParams {
  transactionToken: string;
  paymentAmount?: number;
  companyRef?: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  customerDialCode?: string;
  customerZip?: string;
  companyAccRef?: string;
  userToken?: string;
}

interface RefundTokenParams {
  transactionToken: string;
  refundAmount: number;
  refundDetails: string;
  refundRef?: string;
  refundApproval?: number; // If sent, refund will be checked by a checker
}

interface CancelTokenParams {
  transactionToken: string;
}

interface ChargeTokenCreditCardParams {
  transactionToken: string;
  creditCardNumber: string;
  creditCardExpiry: string; // Format: MMYY
  creditCardCVV: string;
  cardHolderName: string;
  chargeType?: string;
  threeD?: {
    enrolled?: string;
    paresstatus?: string;
    eci?: string;
    xid?: string;
    cavv?: string;
    signature?: string;
    veres?: string;
    pares?: string;
  };
}

interface ChargeTokenMobileParams {
  transactionToken: string;
  phoneNumber: string;
  mno: string; // Mobile Network Operator
  mnoCountry: string;
}

interface ChargeTokenMobileResponse {
  statusCode: string;
  resultExplanation: string;
  instructions?: string;
  redirectOption?: boolean;
}

interface GetBankTransferOptionsResponse {
  result: string;
  resultExplanation: string;
  bankOptions?: BankOption[];
}

interface BankOption {
  bankName: string;
  bankCode: string;
  instructions: {
    bankInstructionsEN?: string;
    bankInstructionsIT?: string;
    bankInstructionsFR?: string;
    bankInstructionsSW?: string;
  };
}

interface ChargeTokenBankTransferParams {
  transactionToken: string;
  bankCode: string;
}

interface ChargeTokenBankTransferResponse {
  result: string;
  resultExplanation: string;
  convertedAmount?: number;
  convertedCurrency?: string;
}

interface MobilePaymentOption {
  country: string;
  countryCode: string;
  paymentname: string;
  logo: string;
  cellularprefix: string;
  amount: number;
  currency: string;
  instructions: string;
}

interface CompanyMobilePaymentOption {
  terminalredirecturi: string;
  terminaltype: string;
  terminalmno: string;
  terminalmnocountry: string;
}

// ===========================
// DPO Pay Service Class
// ===========================

class DPOPayService {
  private apiUrl: string;
  private companyToken: string;
  private paymentUrl: string;

  constructor() {
    this.apiUrl = DPO_API_URL;
    this.companyToken = DPO_COMPANY_TOKEN;
    this.paymentUrl = DPO_PAYMENT_URL;

    if (!this.companyToken) {
      console.warn('⚠️  DPO_COMPANY_TOKEN not configured. Payment processing will fail.');
    }
  }

  /**
   * Make XML API request to DPO
   */
  private async makeRequest<T>(requestBody: any): Promise<T> {
    const xmlBuilder = new Builder({
      xmldec: { version: '1.0', encoding: 'utf-8' },
      renderOpts: { pretty: false },
    });

    const xmlRequest = xmlBuilder.buildObject(requestBody);

    try {
      const response = await axios.post(this.apiUrl, xmlRequest, {
        headers: {
          'Content-Type': 'application/xml',
        },
        timeout: 30000, // 30 seconds
      });

      const parsedResponse = await parseStringPromise(response.data, {
        explicitArray: false,
        mergeAttrs: true,
      });

      return parsedResponse.API3G as T;
    } catch (error: any) {
      console.error('❌ DPO API Error:', error.response?.data || error.message);
      throw new Error(`DPO API request failed: ${error.message}`);
    }
  }

  // ===========================
  // Basic Transaction Operations
  // ===========================

  /**
   * Create Token - Initialize a new payment transaction
   * Returns transaction token for payment processing
   */
  async createToken(params: CreateTokenParams): Promise<CreateTokenResponse> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'createToken',
        Transaction: {
          PaymentAmount: params.paymentAmount.toFixed(2),
          PaymentCurrency: params.paymentCurrency,
          CompanyRef: params.companyRef,
          RedirectURL: params.redirectURL,
          BackURL: params.backURL,
          CompanyRefUnique: params.companyRefUnique || '0',
          PTL: params.ptl || '5',
          ...(params.customerEmail && { CustomerEmail: params.customerEmail }),
          ...(params.customerFirstName && { CustomerFirstName: params.customerFirstName }),
          ...(params.customerLastName && { CustomerLastName: params.customerLastName }),
          ...(params.customerPhone && { CustomerPhone: params.customerPhone }),
          ...(params.customerDialCode && { CustomerDialCode: params.customerDialCode }),
          ...(params.customerAddress && { CustomerAddress: params.customerAddress }),
          ...(params.customerCity && { CustomerCity: params.customerCity }),
          ...(params.customerCountry && { CustomerCountry: params.customerCountry }),
          ...(params.customerZip && { CustomerZip: params.customerZip }),
          ...(params.companyAccRef && { CompanyAccRef: params.companyAccRef }),
          ...(params.userToken && { UserToken: params.userToken }),
        },
        Services: {
          Service: {
            ServiceType: params.serviceType,
            ServiceDescription: params.serviceDescription,
            ServiceDate: params.serviceDate,
          },
        },
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
      transToken: result.TransToken,
      transRef: result.TransRef,
    };
  }

  /**
   * Verify Token - Check transaction payment status
   * Should be called after payment redirect to verify payment completion
   */
  async verifyToken(params: VerifyTokenParams): Promise<VerifyTokenResponse> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'verifyToken',
        ...(params.transactionToken && { TransactionToken: params.transactionToken }),
        ...(params.companyRef && { CompanyRef: params.companyRef }),
        ...(params.verifyTransaction !== undefined && {
          VerifyTransaction: params.verifyTransaction ? '1' : '0',
        }),
        ...(params.accRef && { ACCref: params.accRef }),
        ...(params.customerPhone && { customerPhone: params.customerPhone }),
        ...(params.customerPhonePrefix && { customerPhonePrefix: params.customerPhonePrefix }),
        ...(params.customerEmail && { customerEmail: params.customerEmail }),
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
      customerName: result.CustomerName,
      customerCredit: result.CustomerCredit,
      customerCreditType: result.CustomerCreditType,
      transactionApproval: result.TransactionApproval,
      transactionCurrency: result.TransactionCurrency,
      transactionAmount: result.TransactionAmount ? parseFloat(result.TransactionAmount) : undefined,
      fraudAlert: result.FraudAlert,
      fraudExplanation: result.FraudExplnation,
      transactionNetAmount: result.TransactionNetAmount
        ? parseFloat(result.TransactionNetAmount)
        : undefined,
      transactionSettlementDate: result.TransactionSettlementDate,
      transactionRollingReserveAmount: result.TransactionRollingReserveAmount
        ? parseFloat(result.TransactionRollingReserveAmount)
        : undefined,
      transactionRollingReserveDate: result.TransactionRollingReserveDate,
      customerPhone: result.CustomerPhone,
      customerCountry: result.CustomerCountry,
      customerAddress: result.CustomerAddress,
      customerCity: result.CustomerCity,
      customerZip: result.CustomerZip,
      mobilePaymentRequest: result.MobilePaymentRequest,
      accRef: result.AccRef,
    };
  }

  /**
   * Update Token - Modify existing transaction data
   * Can update customer details and payment amount before payment
   */
  async updateToken(params: UpdateTokenParams): Promise<{ result: string; resultExplanation: string }> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'updateToken',
        TransactionToken: params.transactionToken,
        ...(params.paymentAmount && { PaymentAmount: params.paymentAmount.toFixed(2) }),
        ...(params.companyRef && { CompanyRef: params.companyRef }),
        ...(params.customerEmail && { CustomerEmail: params.customerEmail }),
        ...(params.customerFirstName && { CustomerFirstName: params.customerFirstName }),
        ...(params.customerLastName && { CustomerLastName: params.customerLastName }),
        ...(params.customerAddress && { CustomerAddress: params.customerAddress }),
        ...(params.customerCity && { CustomerCity: params.customerCity }),
        ...(params.customerCountry && { CustomerCountry: params.customerCountry }),
        ...(params.customerDialCode && { CustomerDialCode: params.customerDialCode }),
        ...(params.customerPhone && { CustomerPhone: params.customerPhone }),
        ...(params.customerZip && { CustomerZip: params.customerZip }),
        ...(params.companyAccRef && { CompanyAccRef: params.companyAccRef }),
        ...(params.userToken && { UserToken: params.userToken }),
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
    };
  }

  /**
   * Cancel Token - Cancel an active transaction
   * Can only cancel unpaid transactions
   */
  async cancelToken(params: CancelTokenParams): Promise<{ result: string; resultExplanation: string }> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'cancelToken',
        TransactionToken: params.transactionToken,
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
    };
  }

  /**
   * Refund Token - Process refund for completed transaction
   * Full or partial refunds supported
   */
  async refundToken(params: RefundTokenParams): Promise<{ result: string; resultExplanation: string }> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'refundToken',
        TransactionToken: params.transactionToken,
        refundAmount: params.refundAmount.toFixed(2),
        refundDetails: params.refundDetails,
        ...(params.refundRef && { refundRef: params.refundRef }),
        ...(params.refundApproval !== undefined && { refundApproval: params.refundApproval }),
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
    };
  }

  /**
   * Email To Token - Send/resend payment link to customer email
   * Useful for reminder emails
   */
  async emailToToken(transactionToken: string): Promise<{ result: string; resultExplanation: string }> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'emailToToken',
        TransactionToken: transactionToken,
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
    };
  }

  // ===========================
  // Transaction Payment Options
  // ===========================

  /**
   * Get Mobile Payment Options - Retrieve available mobile payment options for transaction
   * Returns list of mobile money providers with instructions
   */
  async getMobilePaymentOptions(
    transactionToken: string
  ): Promise<{ paymentoptions: { mobileoption: MobilePaymentOption[] } }> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'GetMobilePaymentOptions',
        TransactionToken: transactionToken,
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return result.paymentoptions || { mobileoption: [] };
  }

  /**
   * Charge Token Mobile - Initiate mobile money payment
   * Sends payment request to customer's mobile phone
   */
  async chargeTokenMobile(params: ChargeTokenMobileParams): Promise<ChargeTokenMobileResponse> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'ChargeTokenMobile',
        TransactionToken: params.transactionToken,
        PhoneNumber: params.phoneNumber,
        MNO: params.mno,
        MNOcountry: params.mnoCountry,
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      statusCode: result.StatusCode,
      resultExplanation: result.ResultExplanation,
      instructions: result.instructions,
      redirectOption: result.RedirectOption === '1',
    };
  }

  /**
   * Get Bank Transfer Options - Get available bank transfer options
   * Returns bank details and instructions for manual transfer
   */
  async getBankTransferOptions(transactionToken: string): Promise<GetBankTransferOptionsResponse> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'GetBankTransferOptions',
        TransactionToken: transactionToken,
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
      bankOptions: result.bankOptions?.option || [],
    };
  }

  /**
   * Charge Token Bank Transfer - Mark transaction as pending bank transfer
   * Returns converted amount and currency for selected bank
   */
  async chargeTokenBankTransfer(
    params: ChargeTokenBankTransferParams
  ): Promise<ChargeTokenBankTransferResponse> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'chargeTokenBankTransfer',
        TransactionToken: params.transactionToken,
        BankCode: params.bankCode,
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
      convertedAmount: result.ConvertedAmount ? parseFloat(result.ConvertedAmount) : undefined,
      convertedCurrency: result.ConvertedCurrency,
    };
  }

  /**
   * Charge Token Credit Card - Process credit card payment
   * Direct card charging (requires PCI compliance)
   */
  async chargeTokenCreditCard(
    params: ChargeTokenCreditCardParams
  ): Promise<{ result: string; resultExplanation: string }> {
    const requestBody: any = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'chargeTokenCreditCard',
        TransactionToken: params.transactionToken,
        CreditCardNumber: params.creditCardNumber,
        CreditCardExpiry: params.creditCardExpiry,
        CreditCardCVV: params.creditCardCVV,
        CardHolderName: params.cardHolderName,
        ...(params.chargeType && { ChargeType: params.chargeType }),
      },
    };

    // Add 3D Secure data if provided
    if (params.threeD) {
      requestBody.API3G.ThreeD = {
        ...(params.threeD.enrolled && { Enrolled: params.threeD.enrolled }),
        ...(params.threeD.paresstatus && { Paresstatus: params.threeD.paresstatus }),
        ...(params.threeD.eci && { Eci: params.threeD.eci }),
        ...(params.threeD.xid && { Xid: params.threeD.xid }),
        ...(params.threeD.cavv && { Cavv: params.threeD.cavv }),
        ...(params.threeD.signature && { Signature: params.threeD.signature }),
        ...(params.threeD.veres && { Veres: params.threeD.veres }),
        ...(params.threeD.pares && { Pares: params.threeD.pares }),
      };
    }

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
    };
  }

  /**
   * Charge Token Auth - Charge previously authorized transaction
   * For authorized-only transactions that need to be captured
   */
  async chargeTokenAuth(transactionToken: string): Promise<{ result: string; resultExplanation: string }> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'chargeTokenAuth',
        TransactionToken: transactionToken,
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return {
      result: result.Result,
      resultExplanation: result.ResultExplanation,
    };
  }

  /**
   * Company Mobile Payment Options - Get all mobile payment options for your company
   * Returns configured mobile money terminals
   */
  async getCompanyMobilePaymentOptions(): Promise<{ paymentoptionsmobile: { terminalmobile: CompanyMobilePaymentOption[] } }> {
    const requestBody = {
      API3G: {
        CompanyToken: this.companyToken,
        Request: 'CompanyMobilePaymentOptions',
      },
    };

    const result = await this.makeRequest<any>(requestBody);

    return result.paymentoptionsmobile || { terminalmobile: [] };
  }

  // ===========================
  // Helper Methods
  // ===========================

  /**
   * Generate payment URL for redirect to DPO payment page
   */
  getPaymentURL(transactionToken: string): string {
    return `${this.paymentUrl}/payv2.php?ID=${transactionToken}`;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.companyToken && this.companyToken.length > 0;
  }

  /**
   * Get configuration status
   */
  getConfig() {
    return {
      apiUrl: this.apiUrl,
      paymentUrl: this.paymentUrl,
      isConfigured: this.isConfigured(),
    };
  }
}

// Export singleton instance
export default new DPOPayService();

// Export types for use in other modules
export type {
  CreateTokenParams,
  CreateTokenResponse,
  VerifyTokenParams,
  VerifyTokenResponse,
  UpdateTokenParams,
  RefundTokenParams,
  CancelTokenParams,
  ChargeTokenCreditCardParams,
  ChargeTokenMobileParams,
  ChargeTokenMobileResponse,
  ChargeTokenBankTransferParams,
  ChargeTokenBankTransferResponse,
  GetBankTransferOptionsResponse,
  BankOption,
  MobilePaymentOption,
  CompanyMobilePaymentOption,
};
