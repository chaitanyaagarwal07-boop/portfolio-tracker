import { describe, it, expect } from 'vitest';
import { calculateHoldings } from './calculateHoldings';

describe('calculateHoldings', () => {
  it('calculates a simple buy correctly', () => {
    const transactions = [
      { ticker: 'AAPL', type: 'buy', quantity: 10, price: 170, date: '2026-08-01' },
    ];
    const prices = { AAPL: 200 };

    const result = calculateHoldings(transactions, prices);

    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('AAPL');
    expect(result[0].shares).toBe(10);
    expect(result[0].avgCost).toBe(170);
    expect(result[0].unrealizedGain).toBe(300);
    expect(result[0].realizedGain).toBe(0);
  });

  it('calculates average cost across multiple buys', () => {
    const transactions = [
      { ticker: 'TSLA', type: 'buy', quantity: 10, price: 200, date: '2026-08-01' },
      { ticker: 'TSLA', type: 'buy', quantity: 10, price: 300, date: '2026-08-05' },
    ];
    const prices = { TSLA: 300 };

    const result = calculateHoldings(transactions, prices);

    expect(result[0].shares).toBe(20);
    expect(result[0].avgCost).toBe(250);
  });

  it('calculates realized gain correctly on a partial sell', () => {
    const transactions = [
      { ticker: 'TSLA', type: 'buy', quantity: 10, price: 200, date: '2026-08-01' },
      { ticker: 'TSLA', type: 'sell', quantity: 8, price: 250, date: '2026-08-10' },
    ];
    const prices = { TSLA: 348.79 };

    const result = calculateHoldings(transactions, prices);

    expect(result[0].shares).toBe(2);
    expect(result[0].realizedGain).toBe(400);
    expect(result[0].avgCost).toBe(200);
  });

  it('excludes fully closed positions with no realized gain', () => {
    const transactions = [
      { ticker: 'MSFT', type: 'buy', quantity: 5, price: 100, date: '2026-08-01' },
      { ticker: 'MSFT', type: 'sell', quantity: 5, price: 100, date: '2026-08-02' },
    ];
    const prices = { MSFT: 110 };

    const result = calculateHoldings(transactions, prices);

    expect(result).toHaveLength(0);
  });

  it('handles multiple tickers independently', () => {
    const transactions = [
      { ticker: 'AAPL', type: 'buy', quantity: 10, price: 170, date: '2026-08-01' },
      { ticker: 'TSLA', type: 'buy', quantity: 5, price: 200, date: '2026-08-01' },
    ];
    const prices = { AAPL: 200, TSLA: 250 };

    const result = calculateHoldings(transactions, prices);

    expect(result).toHaveLength(2);
    const aapl = result.find((h) => h.ticker === 'AAPL');
    const tsla = result.find((h) => h.ticker === 'TSLA');

    expect(aapl.shares).toBe(10);
    expect(tsla.shares).toBe(5);
  });
});