# Upstox Live Feed Wrapper

## Overview

This repository provides a wrapper service for **Upstox's live market feed**. It uses WebSockets to subscribe to market data for specific instruments and publishes real-time ticks to a Redis channel (`market-data`). This enables integration with other services for trading, analytics, or monitoring.

## Prerequisites

1. **Redis** must be installed and running locally on the default port (`6379`).

## Setup and Execution

### Steps to Run Locally

1. **Start Redis**
   - Ensure Redis is installed and running on your machine:
     ```bash
     sudo apt update
     sudo apt install redis-server
     sudo systemctl start redis
     ```
   - Verify Redis is running:
     ```bash
     redis-cli ping
     ```
     Expected response: `PONG`.

2. **Run the Live Feed Wrapper**
   - Clone and start this repository:
     ```bash
     git clone <this-repo-url>
     cd <this-repo-folder>
     npm install
     npm run dev
     ```

## API Endpoints

### 1. Initialize Market Feed

**Endpoint**:  
`POST /market-feed-init`  

**Request Body**:
```json
{
  "access_token": "string"
}
```

**Description:**
Initializes the market feed service for the specified access_token.

### 2. Subscribe to Instruments
**Endpoint:**
`POST /subscribe`

**Request Body:**

```json
{
  "instrumentKeys": ["string"]
}
```
**Description:**
Subscribes to live market feed updates for the specified instrumentKeys. You can get instrument keys from https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz

### Real-Time Data Stream
After successful initialization and subscribing to instruments, the live feed data is published to the Redis channel market-data.

**Subscribing to Market Data Ticks in Redis**
You can use a Redis client to subscribe to the market-data channel and receive real-time ticks. Example in Node.js:

```javascript
import Redis from "ioredis";

const socketRedisClient = new Redis(
  "redis://127.0.0.1:6379"
);
socketRedisClient.subscribe("market-data");

socketRedisClient.on("message", (channel, message) => {
  if (channel === "market-data") {
    console.log("Received tick:", JSON.parse(message));
  }
});

```
**Data Format**
The data received on the market-data channel will include real-time ticks for the subscribed instruments. The structure depends on the Upstox WebSocket API.

### Example Workflow
**Initialize Market Feed:**

```bash
curl -X POST http://localhost:3000/market-feed-init \
-H "Content-Type: application/json" \
-d '{"access_token": "your_upstox_access_token"}'
```

**Subscribe to Instruments:**

```bash
curl -X POST http://localhost:3000/subscribe \
-H "Content-Type: application/json" \
-d '{
  "instrumentKeys": ["NSE:RELIANCE", "NSE:TCS"]
}'
```
**Receive Real-Time Data:**

Use a Redis client to listen to the market-data channel and handle incoming ticks as needed.

### Limitations
WebSocket Dependency: Relies on uninterrupted WebSocket connectivity to Upstox's API.

Redis Requirement: A local Redis instance is required to publish and access real-time data.

