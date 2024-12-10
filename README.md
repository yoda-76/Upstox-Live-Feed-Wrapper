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
