import { calculateHoldings } from './utils/calculateHoldings';
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [prices, setPrices] = useState({});

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`);
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchPrice = async (ticker) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/price/${ticker}`);
    const data = await response.json();
    setPrices((prev) => ({ ...prev, [ticker]: data.c }));
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    fetchTransactions();
  }, []);

useEffect(() => {
  const uniqueTickers = [...new Set(transactions.map((t) => t.ticker))];
  uniqueTickers.forEach((ticker) => fetchPrice(ticker));
}, [transactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newTransaction = { ticker, type, quantity, price, date };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) throw new Error('Failed to add transaction');

      setTicker('');
      setType('buy');
      setQuantity('');
      setPrice('');
      setDate('');

      fetchTransactions(); // refresh the list after adding
    } catch (err) {
      console.error(err);
      alert('Error adding transaction');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/${id}`, {
        method: 'DELETE',
      });
      fetchTransactions(); // refresh after deleting
    } catch (err) {
      console.error(err);
    }
  };



const holdings = calculateHoldings(transactions, prices);

const totalInvested = holdings.reduce((sum, h) => sum + h.avgCost * h.shares, 0);

const totalCurrentValue = holdings.reduce((sum, h) => {
  const price = h.currentPrice != null ? h.currentPrice : h.avgCost;
  return sum + price * h.shares;
}, 0);

const totalUnrealizedGain = holdings.reduce((sum, h) => sum + h.unrealizedGain, 0);
const totalRealizedGain = holdings.reduce((sum, h) => sum + h.realizedGain, 0);
const totalGainLoss = totalUnrealizedGain + totalRealizedGain;
const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Portfolio Tracker</h1>
      <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '30px',
  }}
>
  
  <div>
    <div style={{ fontSize: '12px', color: '#666' }}>Total Invested</div>
    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${totalInvested.toFixed(2)}</div>
  </div>
  <div>
    <div style={{ fontSize: '12px', color: '#666' }}>Current Value</div>
    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${totalCurrentValue.toFixed(2)}</div>
  </div>
  <div>
    <div style={{ fontSize: '12px', color: '#666' }}>Total Gain/Loss</div>
    <div
      style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: totalGainLoss > 0 ? 'green' : totalGainLoss < 0 ? 'red' : 'black',
      }}
    >
      {totalGainLoss > 0 ? '+' : ''}${totalGainLoss.toFixed(2)} ({totalGainLossPercent.toFixed(2)}%)
    </div>
  </div>
</div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Ticker: </label>
          <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Type: </label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Quantity: </label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Price: </label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Date: </label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <button type="submit">Add Transaction</button>
      </form>

<h2>Holdings</h2>
<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
  <thead>
    <tr>
      <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Ticker</th>
      <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Shares Held</th>
      <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Avg Cost</th>
      <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Current Price</th>
      <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Unrealized G/L</th>
      <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Realized G/L</th>
    </tr>
  </thead>
  <tbody>
    {holdings.map((h) => (
      <tr key={h.ticker}>
        <td>{h.ticker}</td>
        <td>{h.shares}</td>
        <td>${h.avgCost.toFixed(2)}</td>
        <td>{h.currentPrice != null ? `$${h.currentPrice}` : 'Loading...'}</td>
        <td style={{ color: h.unrealizedGain > 0 ? 'green' : h.unrealizedGain < 0 ? 'red' : 'black' }}>
          {h.shares > 0 ? `${h.unrealizedGain > 0 ? '+' : ''}$${h.unrealizedGain.toFixed(2)}` : '—'}
        </td>
        <td style={{ color: h.realizedGain > 0 ? 'green' : h.realizedGain < 0 ? 'red' : 'black' }}>
          {h.realizedGain !== 0 ? `${h.realizedGain > 0 ? '+' : ''}$${h.realizedGain.toFixed(2)}` : '—'}
        </td>
      </tr>
    ))}
  </tbody>
</table>

      <h2>Transactions</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
           <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Ticker</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Type</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Qty</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Buy Price</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Current Price</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Gain/Loss</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Date</th>
            <th></th>
          </tr>
        </thead>
              <tbody>
        {transactions.map((t) => {
          const currentPrice = prices[t.ticker];
          const gainLoss =
            currentPrice != null
              ? ((currentPrice - t.price) * t.quantity).toFixed(2)
              : null;
          
          return (
            <tr key={t.id}>
              <td>{t.ticker}</td>
              <td>{t.type}</td>
              <td>{t.quantity}</td>
              <td>{t.price}</td>
              <td>{currentPrice != null ? currentPrice : 'Loading...'}</td>
              <td style={{ color: gainLoss > 0 ? 'green' : gainLoss < 0 ? 'red' : 'black' }}>
                {gainLoss != null ? `${gainLoss > 0 ? '+' : ''}${gainLoss}` : '—'}
              </td>
              <td>{new Date(t.date).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleDelete(t.id)}>Delete</button>
              </td>
            </tr>
          );
        })}
      </tbody>
      </table>
    </div>
  );
}

export default App;