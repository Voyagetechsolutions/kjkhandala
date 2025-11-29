const axios = require('axios');
const { parseStringPromise, Builder } = require('xml2js');

// DPO Pay API Configuration
const DPO_API_URL = process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/';
const DPO_COMPANY_TOKEN = process.env.DPO_COMPANY_TOKEN || '';

/**
 * DPO Pay Service
 * Handles all interactions with DPO Pay API
 */
class DPOPayService {
  constructor() {
    this.apiURL = DPO_API_URL;
    this.companyToken = DPO_COMPANY_TOKEN;
  }

  /**
   * Build XML request for DPO API
   */
  buildXMLRequest(apiType, data) {
    const builder = new Builder({ rootName: 'API3G' });
    
    const xmlData = {
      CompanyToken: this.companyToken,
      Request: apiType,
      ...data
    };

    return builder.buildObject(xmlData);
  }

  /**
   * Parse XML response from DPO API
   */
  async parseXMLResponse(xmlString) {
    try {
      const result = await parseStringPromise(xmlString, { 
        explicitArray: false,
        ignoreAttrs: true 
      });
      return result.API3G;
    } catch (error) {
      console.error('XML parsing error:', error);
      throw new Error('Failed to parse XML response');
    }
  }

  /**
   * Make HTTP request to DPO API
   */
  async makeRequest(xmlData) {
    try {
      const response = await axios.post(this.apiURL, xmlData, {
        headers: {
          'Content-Type': 'application/xml',
        },
        timeout: 30000, // 30 seconds timeout
      });

      return await this.parseXMLResponse(response.data);
    } catch (error) {
      console.error('DPO API request error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw new Error('Failed to communicate with DPO API');
    }
  }

  /**
   * Create payment token
   */
  async createToken(params) {
    try {
      const xmlData = this.buildXMLRequest('createToken', {
        TransactionToken: params.transToken || '',
        Amount: params.amount.toString(),
        Currency: params.currency,
        CompanyRef: params.companyRef || '',
        RedirectURL: params.redirectURL || '',
        BackURL: params.backURL || '',
        customerEmail: params.customerEmail || '',
        customerFirstName: params.customerFirstName || '',
        customerLastName: params.customerLastName || '',
        customerPhone: params.customerPhone || '',
        customerCountry: params.customerCountry || '',
        customerAddress: params.customerAddress || '',
        customerCity: params.customerCity || '',
        customerZip: params.customerZip || '',
        customerDob: params.customerDob || '',
        ServiceType: 'Bus Ticket',
        ServiceDescription: 'Bus ticket booking',
        ServiceDate: new Date().toISOString().split('T')[0],
      });

      const response = await this.makeRequest(xmlData);

      if (response.Result === '000' || response.Result === '001') {
        return {
          success: true,
          transToken: response.TransToken,
          transRef: response.TransRef,
          paymentURL: `https://secure.3gdirectpay.com/payv2.php?ID=${response.TransToken}`,
        };
      } else {
        return {
          success: false,
          message: response.ResultExplanation || 'Payment initialization failed',
          resultCode: response.Result,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Payment initialization failed',
      };
    }
  }

  /**
   * Verify payment token
   */
  async verifyToken(params) {
    try {
      const xmlData = this.buildXMLRequest('verifyToken', {
        TransactionToken: params.transToken || '',
      });

      const response = await this.makeRequest(xmlData);

      if (response.Result === '000' || response.Result === '001') {
        return {
          success: true,
          resultCode: response.Result,
          resultMessage: response.ResultExplanation,
          customerName: response.CustomerName,
          customerCredit: response.CustomerCredit,
          customerCreditType: response.CustomerCreditType,
          transactionDate: response.TransactionDate,
          transactionCurrency: response.TransactionCurrency,
          transactionAmount: response.TransactionAmount,
          approvalCode: response.ApprovalCode,
          settlementDate: response.SettlementDate,
          netAmount: response.NetAmount,
          merchantReference: response.MerchantReference,
        };
      } else {
        return {
          success: false,
          message: response.ResultExplanation || 'Payment verification failed',
          resultCode: response.Result,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Payment verification failed',
      };
    }
  }

  /**
   * Cancel payment token
   */
  async cancelToken(params) {
    try {
      const xmlData = this.buildXMLRequest('cancelToken', {
        TransactionToken: params.transToken || '',
      });

      const response = await this.makeRequest(xmlData);

      if (response.Result === '904') {
        return {
          success: true,
          resultCode: response.Result,
          resultMessage: response.ResultExplanation,
        };
      } else {
        return {
          success: false,
          message: response.ResultExplanation || 'Payment cancellation failed',
          resultCode: response.Result,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Payment cancellation failed',
      };
    }
  }

  /**
   * Refund payment token
   */
  async refundToken(params) {
    try {
      const xmlData = this.buildXMLRequest('refundToken', {
        TransactionToken: params.transToken || '',
        RefundAmount: params.refundAmount.toString(),
        RefundDetails: params.refundReason || 'Customer refund',
        RefundRef: params.refundRef || '',
      });

      const response = await this.makeRequest(xmlData);

      if (response.Result === '000' || response.Result === '001') {
        return {
          success: true,
          resultCode: response.Result,
          resultMessage: response.ResultExplanation,
          refundAmount: response.RefundAmount,
          refundDate: response.RefundDate,
        };
      } else {
        return {
          success: false,
          message: response.ResultExplanation || 'Refund processing failed',
          resultCode: response.Result,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Refund processing failed',
      };
    }
  }

  /**
   * Get mobile payment options
   */
  async getMobilePaymentOptions(params) {
    try {
      const xmlData = this.buildXMLRequest('getMobilePaymentOptions', {
        TransactionToken: params.transToken || '',
      });

      const response = await this.makeRequest(xmlData);

      if (response.Result === '000' || response.Result === '001') {
        return {
          success: true,
          options: response.MobilePaymentOptions || {},
        };
      } else {
        return {
          success: false,
          message: response.ResultExplanation || 'Failed to get mobile options',
          resultCode: response.Result,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get mobile options',
      };
    }
  }

  /**
   * Charge mobile payment
   */
  async chargeTokenMobile(params) {
    try {
      const xmlData = this.buildXMLRequest('chargeTokenMobile', {
        TransactionToken: params.transToken || '',
        MNO: params.mno || '',
        MNOCountry: params.mnoCountry || '',
        PhoneNumber: params.phoneNumber || '',
        CustomerCountryCode: params.customerCountryCode || '',
        CustomerDialingCode: params.customerDialingCode || '',
      });

      const response = await this.makeRequest(xmlData);

      if (response.Result === '000' || response.Result === '001') {
        return {
          success: true,
          resultCode: response.Result,
          resultMessage: response.ResultExplanation,
          reference: response.Reference,
          instructions: response.Instructions,
        };
      } else {
        return {
          success: false,
          message: response.ResultExplanation || 'Mobile payment failed',
          resultCode: response.Result,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Mobile payment failed',
      };
    }
  }

  /**
   * Get payment URL for redirect
   */
  getPaymentURL(transToken) {
    return `https://secure.3gdirectpay.com/payv2.php?ID=${transToken}`;
  }
}

module.exports = new DPOPayService();
