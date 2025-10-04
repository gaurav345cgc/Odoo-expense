const axios = require('axios');
const config = require('../config/env');

class CurrencyService {
  constructor() {
    this.baseUrl = config.EXCHANGE_RATE_API_URL;
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get exchange rates for a base currency
   * @param {string} baseCurrency - Base currency code (e.g., 'USD')
   * @returns {Promise<Object>} Exchange rates object
   */
  async getExchangeRates(baseCurrency = 'USD') {
    try {
      // Check cache first
      const cacheKey = `rates_${baseCurrency}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📊 Using cached exchange rates for ${baseCurrency}`);
        return cached.data;
      }

      console.log(`🌍 Fetching exchange rates for base currency: ${baseCurrency}`);
      
      const response = await axios.get(`${this.baseUrl}/${baseCurrency}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Expense-Management-System/1.0.0'
        }
      });

      if (response.data && response.data.rates) {
        const rates = {
          base: response.data.base,
          date: response.data.date,
          rates: response.data.rates
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: rates,
          timestamp: Date.now()
        });

        console.log(`✅ Successfully fetched exchange rates for ${baseCurrency}`);
        return rates;
      } else {
        throw new Error('Invalid response format from exchange rate API');
      }

    } catch (error) {
      console.error('❌ Error fetching exchange rates:', error.message);
      
      // Return fallback rates for common currencies
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Promise<Object>} Conversion result
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          conversionRate: 1,
          fromCurrency,
          toCurrency,
          convertedAt: new Date()
        };
      }

      // Get exchange rates for the target currency as base
      const rates = await this.getExchangeRates(toCurrency);
      
      if (!rates.rates[fromCurrency]) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      // Calculate conversion rate
      // If base is toCurrency, we need to invert the rate
      const conversionRate = 1 / rates.rates[fromCurrency];
      const convertedAmount = amount * conversionRate;

      const result = {
        originalAmount: amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
        conversionRate: Math.round(conversionRate * 100000) / 100000, // Round to 5 decimal places
        fromCurrency,
        toCurrency,
        convertedAt: new Date(),
        rateDate: rates.date
      };

      console.log(`💱 Converted ${amount} ${fromCurrency} to ${result.convertedAmount} ${toCurrency} (rate: ${result.conversionRate})`);
      
      return result;

    } catch (error) {
      console.error('❌ Error converting currency:', error.message);
      
      // Return fallback conversion
      return this.getFallbackConversion(amount, fromCurrency, toCurrency);
    }
  }

  /**
   * Get company's base currency (mock implementation)
   * @param {string} companyId - Company ID
   * @returns {Promise<string>} Base currency code
   */
  async getCompanyBaseCurrency(companyId) {
    // Mock implementation - in real app, this would fetch from company settings
    const mockCurrencies = {
      [config.MOCK_COMPANY_ID]: 'USD',
      '507f1f77bcf86cd799439015': 'EUR',
      '507f1f77bcf86cd799439016': 'GBP'
    };

    const baseCurrency = mockCurrencies[companyId] || 'USD';
    console.log(`🏢 Company ${companyId} base currency: ${baseCurrency}`);
    
    return baseCurrency;
  }

  /**
   * Get fallback exchange rates when API fails
   * @param {string} baseCurrency - Base currency
   * @returns {Object} Fallback rates
   */
  getFallbackRates(baseCurrency) {
    console.log(`⚠️ Using fallback exchange rates for ${baseCurrency}`);
    
    const fallbackRates = {
      USD: {
        base: 'USD',
        date: new Date().toISOString().split('T')[0],
        rates: {
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110.0,
          CAD: 1.25,
          AUD: 1.35,
          CHF: 0.92,
          CNY: 6.45,
          INR: 74.0
        }
      },
      EUR: {
        base: 'EUR',
        date: new Date().toISOString().split('T')[0],
        rates: {
          USD: 1.18,
          GBP: 0.86,
          JPY: 129.0,
          CAD: 1.47,
          AUD: 1.59,
          CHF: 1.08,
          CNY: 7.59,
          INR: 87.0
        }
      },
      GBP: {
        base: 'GBP',
        date: new Date().toISOString().split('T')[0],
        rates: {
          USD: 1.37,
          EUR: 1.16,
          JPY: 150.0,
          CAD: 1.71,
          AUD: 1.85,
          CHF: 1.26,
          CNY: 8.84,
          INR: 101.0
        }
      }
    };

    return fallbackRates[baseCurrency] || fallbackRates.USD;
  }

  /**
   * Get fallback conversion when API fails
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Object} Fallback conversion result
   */
  getFallbackConversion(amount, fromCurrency, toCurrency) {
    console.log(`⚠️ Using fallback conversion for ${amount} ${fromCurrency} to ${toCurrency}`);
    
    const fallbackRates = this.getFallbackRates(toCurrency);
    const conversionRate = fallbackRates.rates[fromCurrency] || 1;
    const convertedAmount = amount * conversionRate;

    return {
      originalAmount: amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      conversionRate: Math.round(conversionRate * 100000) / 100000,
      fromCurrency,
      toCurrency,
      convertedAt: new Date(),
      rateDate: fallbackRates.date,
      isFallback: true
    };
  }

  /**
   * Get supported currencies list
   * @returns {Array} List of supported currency codes
   */
  getSupportedCurrencies() {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR',
      'BRL', 'MXN', 'RUB', 'KRW', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK',
      'DKK', 'PLN', 'CZK', 'HUF', 'TRY', 'ZAR', 'AED', 'SAR', 'QAR',
      'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD'
    ];
  }

  /**
   * Validate currency code
   * @param {string} currency - Currency code to validate
   * @returns {boolean} True if valid
   */
  isValidCurrency(currency) {
    return this.getSupportedCurrencies().includes(currency.toUpperCase());
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Currency cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }
}

module.exports = new CurrencyService();