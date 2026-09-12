const express = require('express');
const cors = require('cors');
const pool = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});
// Add a new transaction
app.post('/api/transactions', async (req, res) => {
  const { ticker, type, quantity, price, date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO transactions (ticker, type, quantity, price, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ticker, type, quantity, price, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions ORDER BY date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});
// Update a transaction
app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { ticker, type, quantity, price, date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE transactions
       SET ticker = $1, type = $2, quantity = $3, price = $4, date = $5
       WHERE id = $6 RETURNING *`,
      [ticker, type, quantity, price, date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete a transaction
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});
const axios = require('axios');

// Simple in-memory cache
const priceCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

app.get('/api/price/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const symbol = ticker.toUpperCase();

  // Check cache first
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ ...cached.data, fromCache: true });
  }

  try {
    const response = await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol, token: process.env.FINNHUB_API_KEY },
    });

    priceCache.set(symbol, { data: response.data, timestamp: Date.now() });
    res.json({ ...response.data, fromCache: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));