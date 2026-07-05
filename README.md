# ⚡ NYSE — Real-Time Stock Exchange

> Production-grade trading platform with sub-millisecond order matching engine, real-time WebSocket orderbook, and live candlestick charts. Built with a fully dockerized microservices architecture.

<p align="center">
  <img src="./docs/architecture.png" alt="Architecture Diagram" width="900"/>
</p>

---

## 📸 Screenshots

<p align="center">
  <img src="./docs/screenshot-user1.png" alt="User 1 - Buy Side" width="900"/>
  <br/>
  <em>User 1 — Buy side view with live orderbook & candlestick chart</em>
</p>

<br/>

<p align="center">
  <img src="./docs/screenshot-user2.png" alt="User 2 - Sell Side" width="900"/>
  <br/>
  <em>User 2 — Sell side view with real-time trade execution</em>
</p>

---

## ✨ Features

- ⚡ **In-memory matching engine** — sub-millisecond order matching
- 📊 **Real-time orderbook** — live bid/ask updates via WebSocket pub/sub
- 📈 **Live candlestick charts** — TradingView-style charts with 1m / 5m / 1h / 1d intervals
- 💱 **Limit & Market orders** — full order lifecycle (pending → partial → filled / cancelled)
- 🔐 **JWT authentication** — secure signup / login flow
- 💾 **Persistent storage** — TimescaleDB hypertables for time-series trade data
- 📡 **Redis pub/sub** — event-driven architecture for depth, trades, and orders
- 🐳 **Fully dockerized** — spin up the entire stack with a single command
- 🎨 **Modern UI** — dark-themed React frontend with TailwindCSS
- 🌐 **Multi-market support** — TATA_INR, PAYTM_INR, ZOMATO_INR

---

## 🏗️ Architecture Flow

1. **Browser** sends order → **HTTP API Server** (`/api/v1/order`)
2. API Server **validates order** and generates `orderId`
3. Order is **pushed into a Redis queue**
4. **Matching Engine** picks the order → routes it to the correct **orderbook** (TATA_INR / PAYTM_INR / ZOMATO_INR)
5. Engine runs the **matching algorithm** and persists **trades to TimescaleDB**
6. Engine **publishes events** (`ORDER_FILLED`, `BOOK_UPDATED`, `trades@MARKET`) via Redis pub/sub
7. **WebSocket Server** broadcasts events to subscribed clients
8. **Frontend UI** updates in real-time — orderbook, chart, balance, trades

---

## 🛠️ Tech Stack

### Frontend

- ⚛️ **React 19** + **TypeScript**
- 🎨 **TailwindCSS** — utility-first styling
- 🗂️ **Zustand** — lightweight state management
- 📊 **TradingView Lightweight Charts** — professional candlestick charts
- 🔌 **Native WebSocket** — real-time data streaming

### Backend

- 🚀 **Bun** — blazing fast JS runtime
- 🌐 **Express** — HTTP API server
- 🔌 **ws** — WebSocket server
- 🎯 **Custom matching engine** — in-memory order matching (TypeScript)
- 📦 **Prisma ORM** — type-safe database access

### Database & Cache

- 🐘 **TimescaleDB** (PostgreSQL) — time-series hypertables + continuous aggregates for klines
- 🔴 **Redis** — message queue + pub/sub

### DevOps

- 🐳 **Docker** + **Docker Compose**
- 🔧 **Nginx** — frontend serving in production

---

## 🐳 Quick Start with Docker (Recommended)

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) & Docker Compose installed

### 1. Clone the repo

```bash
git clone https://github.com/LALIT666/NYSE.git
cd NYSE
```

### 2. Create a `.env` file in the root directory

```bash
# Postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=exchange

# DB connection (for services running inside Docker network)
DB_HOST=timescaledb
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=exchange

# Redis
REDIS_URL=redis://redis:6379

# Prisma
DATABASE_URL=postgresql://postgres:password@timescaledb:5432/exchange

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# URLs
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001
```

### 3. Start everything with one command

```bash
docker compose up --build
```

That's it! 🎉 The following services will spin up:

| Service            | URL                   | Description                |
| ------------------ | --------------------- | -------------------------- |
| 🖥️ **Frontend**    | http://localhost:5173 | React trading UI           |
| 🌐 **HTTP API**    | http://localhost:3000 | REST API for orders / auth |
| 🔌 **WebSocket**   | ws://localhost:3001   | Real-time market data      |
| 🐘 **TimescaleDB** | localhost:5432        | Postgres database          |
| 🔴 **Redis**       | localhost:6379        | Queue + pub/sub            |

### 4. Stop everything

```bash
# Stop containers
docker compose down

# Stop AND delete volumes (fresh database on next run)
docker compose down -v
```

---

## 💻 Run Locally Without Docker

**Prerequisites:**

- [Bun](https://bun.sh) installed
- **PostgreSQL 16 + TimescaleDB extension** (easiest via Docker)
- **Redis** (easiest via Docker)

### 1. Start only Postgres + Redis via Docker

```bash
# TimescaleDB
docker run -d --name timescaledb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=exchange \
  -p 5432:5432 \
  timescale/timescaledb:latest-pg16

# Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 2. Apply the schema

```bash
docker exec -i timescaledb psql -U postgres -d exchange < init-db/01-schema.sql
```

### 3. Create `.env` files for each service

**`backend/db/.env`** (for Prisma):

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/exchange
```

**`backend/http-server/.env`:**

```bash
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/exchange
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

**`backend/redis-engine/.env`:**

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/exchange
REDIS_URL=redis://localhost:6379
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=exchange
```

**`backend/ws-server/.env`:**

```bash
PORT=3001
REDIS_URL=redis://localhost:6379
```

**`frontend/.env`:**

```bash
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001
```

### 4. Install dependencies

```bash
# Prisma (DB client)
cd backend/db && bun install && bunx prisma generate

# HTTP Server
cd ../http-server && bun install

# WebSocket Server
cd ../ws-server && bun install

# Matching Engine
cd ../redis-engine && bun install

# Frontend
cd ../../frontend && bun install
```

### 5. Run each service in a separate terminal

**Terminal 1 — HTTP Server:**

```bash
cd backend/http-server
bun run src/index.ts
```

**Terminal 2 — WebSocket Server:**

```bash
cd backend/ws-server
bun run src/index.ts
```

**Terminal 3 — Matching Engine:**

```bash
cd backend/redis-engine
bun run src/index.ts
```

**Terminal 4 — Frontend:**

```bash
cd frontend
bun dev
```

Open **http://localhost:5173** in your browser 🚀

---

## 🧪 Test the Exchange

1. **Sign up two users** in different browser tabs (or one incognito)
2. **User 1:** Place a **Sell** order (e.g., 10 TATA @ ₹100)
3. **User 2:** Place a **Buy** order (e.g., 10 TATA @ ₹100)
4. Watch the magic ✨
   - Orders match instantly
   - Orderbook updates in real-time
   - Candlestick chart draws new candles
   - Recent trades feed updates
   - Balances get updated live

### 💡 Tips for visible candles

- Place multiple orders at **different prices** (e.g., 100, 102, 101, 105)
- Each 1-minute window = 1 candle
- **Green candle** = price went up | **Red candle** = price went down
- Use `5m` / `1h` timeframes to see aggregated candles

### 💡 Tips for a filled orderbook

Place orders that **won't match immediately** (below/above market price):

**Buy side (bids)** — below current price:

- Buy @ 99, qty 10
- Buy @ 98, qty 20
- Buy @ 97, qty 15

**Sell side (asks)** — above current price:

- Sell @ 101, qty 10
- Sell @ 102, qty 25
- Sell @ 103, qty 15

---

## 📁 Project Structure

```
NYSE/
├── backend/
│   ├── db/                    # Prisma schema + migrations
│   ├── http-server/           # REST API (Express + Bun)
│   ├── ws-server/             # WebSocket server (pub/sub)
│   └── redis-engine/          # Matching engine (in-memory)
├── frontend/                  # React + TypeScript + Vite
├── init-db/
│   └── 01-schema.sql          # TimescaleDB + Prisma schema (auto-loaded by Docker)
├── docs/
│   ├── architecture.png       # System architecture diagram
│   ├── screenshot-user1.png   # User 1 dashboard
│   └── screenshot-user2.png   # User 2 dashboard
├── docker-compose.yml         # Full stack orchestration
└── README.md
```

---

## 🚀 Roadmap

- [ ] Deploy to production (Railway + Vercel)
- [ ] Add more markets (BTC, ETH, etc.)
- [ ] Implement stop-loss & take-profit orders
- [ ] Add user portfolio analytics & PnL
- [ ] Rate limiting + advanced security
- [ ] Mobile responsive UI
- [ ] Add market maker bot for realistic liquidity

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/LALIT666/NYSE/issues).

---

## 📄 License

MIT License — feel free to use this project for learning and portfolio purposes.

---

## 👨‍💻 Author

**LALIT KUMAR**

- GitHub: [@LALIT666](https://github.com/LALIT666)

---

<p align="center">
  ⭐ <b>If you like this project, give it a star!</b> ⭐
</p>
