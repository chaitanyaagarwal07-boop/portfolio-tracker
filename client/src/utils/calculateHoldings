export function calculateHoldings(transactions, prices) {
  const holdingsMap = {};

  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((t) => {
    const { ticker, type, quantity, price } = t;
    const qty = parseFloat(quantity);
    const p = parseFloat(price);

    if (!holdingsMap[ticker]) {
      holdingsMap[ticker] = { shares: 0, totalCost: 0, realizedGain: 0 };
    }

    const h = holdingsMap[ticker];

    if (type === 'buy') {
      h.shares += qty;
      h.totalCost += qty * p;
    } else if (type === 'sell') {
      const avgCost = h.shares > 0 ? h.totalCost / h.shares : 0;
      const realizedForThisSale = (p - avgCost) * qty;
      h.realizedGain += realizedForThisSale;
      h.totalCost -= avgCost * qty;
      h.shares -= qty;
    }
  });

  return Object.entries(holdingsMap)
    .filter(([_, h]) => h.shares > 0.0001 || h.realizedGain !== 0)
    .map(([ticker, h]) => {
      const avgCost = h.shares > 0 ? h.totalCost / h.shares : 0;
      const currentPrice = prices[ticker];
      const unrealizedGain =
        h.shares > 0 && currentPrice != null ? (currentPrice - avgCost) * h.shares : 0;

      return {
        ticker,
        shares: h.shares,
        avgCost,
        currentPrice,
        unrealizedGain,
        realizedGain: h.realizedGain,
      };
    });
}