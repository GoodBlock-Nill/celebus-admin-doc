'use client';

import { create } from 'zustand';
import type { Exchange, ExchangeConfig } from '@/lib/types';
import { mockExchanges, mockExchangeConfig } from '@/mock/exchanges';
import { generateId } from '@/lib/utils';

interface ExchangeState {
  exchanges: Exchange[];
  config: ExchangeConfig;
  executeCharge: (celbAmount: number) => void;
  executeWithdraw: (gpAmount: number, walletAddress: string) => void;
}

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  exchanges: mockExchanges,
  config: mockExchangeConfig,

  executeCharge: (celbAmount) => {
    const { config, exchanges } = get();
    const gpAmount = Math.floor(celbAmount * config.celbToGpRate);
    const now = new Date().toISOString();

    const newExchange: Exchange = {
      txid: `TX${generateId().toUpperCase()}`,
      datetime: now,
      direction: 'CHARGE',
      gpAmount,
      celbAmount,
      rate: config.celbToGpRate,
      gpBefore: 0,
      gpAfter: gpAmount,
      status: 'SUCCESS',
      walletAddress: config.depositAddress,
      failureReason: null,
    };

    set({ exchanges: [newExchange, ...exchanges] });
  },

  executeWithdraw: (gpAmount, walletAddress) => {
    const { config, exchanges } = get();
    const celbAmount = gpAmount / config.gpToCelbRate;
    const now = new Date().toISOString();

    const newExchange: Exchange = {
      txid: `TX${generateId().toUpperCase()}`,
      datetime: now,
      direction: 'WITHDRAW',
      gpAmount,
      celbAmount,
      rate: config.gpToCelbRate,
      gpBefore: gpAmount,
      gpAfter: 0,
      status: 'PENDING',
      walletAddress,
      failureReason: null,
    };

    set({ exchanges: [newExchange, ...exchanges] });
  },
}));
