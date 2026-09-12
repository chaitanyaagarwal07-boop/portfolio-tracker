# Portfolio Tracker

A full-stack web app for tracking stock investments — records buy/sell transactions, pulls live market prices, and calculates real portfolio metrics (average cost, realized/unrealized gains) rather than just logging trades.

🔗 **Live demo**: [https://portfolio-tracker-flame-nu.vercel.app](https://portfolio-tracker-flame-nu.vercel.app)

📦 **Backend API**: [https://portfolio-tracker-api-ug1a.onrender.com](https://portfolio-tracker-api-ug1a.onrender.com)

## Why I built this

Built to strengthen my full-stack skills for tech job applications, focusing on real-world engineering concerns like API rate limits and financial calculation correctness, not just CRUD.

## Features

- Add, edit, and delete stock transactions (buy/sell)
- Live price lookups via the Finnhub API
- In-memory TTL caching to stay within API rate limits
- Portfolio holdings view with **average-cost accounting**:
  - Realized gains (from completed sells)
  - Unrealized gains (from current open positions, marked to live market price)
- Portfolio-level summary (total invested, current value, total gain/loss)
- Unit tests covering the cost-basis calculation logic

## Tech Stack

**Frontend:** React (Vite), Vitest for testing
**Backend:** Node.js, Express
**Database:** PostgreSQL (hosted on Neon)
**External API:** Finnhub (live stock prices)

## Architecture
Client (React) → Express API → PostgreSQL (Neon)
↓
Finnhub API (cached)

- Transactions are stored as the single source of truth — holdings (net position, average cost, gains) are **derived/calculated on the fly**, not stored redundantly. This avoids data drift between transactions and computed positions.
- Price lookups are cached in-memory with a 60-second TTL to avoid hitting Finnhub's free-tier rate limit (60 calls/min).

## Key Engineering Decisions

- **Average-cost method** was chosen over FIFO for cost-basis calculation — simpler to implement and reason about, while still being financially accurate. FIFO would be a natural next step for more precise tax-lot tracking.
- **Parameterized SQL queries** throughout to prevent SQL injection.
- **In-memory caching** was chosen over Redis at this scale (single server instance) — Redis would be the natural upgrade path if this needed to scale horizontally across multiple server instances.

> **Note**: The backend is hosted on Render's free tier, which spins down after periods of inactivity. The first request after idle time may take 30-60 seconds to respond while it wakes up.
## Running Locally

### Prerequisites
- Node.js installed
- A PostgreSQL database (e.g. free tier on [Neon](https://neon.tech))
- A free API key from [Finnhub](https://finnhub.io)

### Backend setup
```bash
cd server
npm install
```
Create a `.env` file in `server/` with:
DATABASE_URL=postgresql://neondb_owner:npg_GI9ms3jBKTry@ep-odd-hat-axkn8yer-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
FINNHUB_API_KEY=da5li41r01qo45khthfgda5li41r01qo45khthg0
Then run the SQL below in your Postgres instance to create the schema:
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL,
  type VARCHAR(4) NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```
Start the server:
```bash
npm run dev
```
Runs on `http://localhost:5000`

### Frontend setup
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173` (or next available port)

### Running tests
```bash
cd client
npm run test
```

## Screenshots
![Holdings view](./screenshots/HoldingsTransc.png)

## Possible Future Improvements

- FIFO cost-basis method as an alternative to average cost
- Historical performance chart
- Multi-user support with authentication
- CSV import from real brokerage exports
- Redis-based caching for horizontal scaling