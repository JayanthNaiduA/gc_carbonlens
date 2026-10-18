import React, { createContext, useContext, useState } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  INR: 83.0, // 1 USD = 83 INR
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.0,
};

export function convertAndFormatPrice(usdPrice: number, currency: CurrencyCode = 'INR'): string {
  const rate = CURRENCY_RATES[currency] || 83.0;
  const converted = usdPrice * rate;
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  if (currency === 'INR') {
    return `${symbol}${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'JPY') {
    return `${symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}

export function convertInrAndFormatPrice(inrPrice: number, currency: CurrencyCode = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  if (currency === 'INR') {
    return `${symbol}${Math.round(inrPrice).toLocaleString('en-IN')}`;
  }
  const usdEquiv = inrPrice / 83.0;
  const rate = CURRENCY_RATES[currency] || 1.0;
  const converted = usdEquiv * rate;
  if (currency === 'JPY') {
    return `${symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatPrice: (usdPrice: number) => string;
  formatInrPrice: (inrPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('carbonlens_currency');
      if (saved && saved in CURRENCY_SYMBOLS) {
        return saved as CurrencyCode;
      }
    } catch {
      // fallback
    }
    return 'INR';
  });

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem('carbonlens_currency', c);
    } catch {
      // ignore
    }
  };

  const formatPrice = (usdPrice: number) => {
    return convertAndFormatPrice(usdPrice, currency);
  };

  const formatInrPrice = (inrPrice: number) => {
    return convertInrAndFormatPrice(inrPrice, currency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, formatInrPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    return {
      currency: 'INR',
      setCurrency: () => {},
      formatPrice: (p: number) => convertAndFormatPrice(p, 'INR'),
      formatInrPrice: (p: number) => convertInrAndFormatPrice(p, 'INR'),
    };
  }
  return context;
};

// Backwards compatibility
export const formatPrice = convertAndFormatPrice;
export const formatInrPrice = convertInrAndFormatPrice;
