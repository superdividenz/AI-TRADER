# Dex AI Trading Platform

A minimal TypeScript crypto trading platform focused on decentralized exchanges (DEX) for **Ethereum (Uniswap)** and **Solana (Jupiter)**.  
Includes a pluggable strategy interface, backtesting support, and adapters for Ethereum and Solana swaps.

---

## Features

- Strategy interface with `initialize` and `onBar` lifecycle hooks
- Simple AMM backtester simulating constant product swaps
- Ethereum Uniswap adapter using Ethers.js for live swaps
- Solana Jupiter adapter stub for swap transactions
- Sample simple mean reversion strategy
- Example backtest runner on sample OHLC bars

---

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn
- TypeScript installed globally or via `npm install -D typescript ts-node`

### Setup

1. Clone or create the project folder and run the provided setup script:

   ```bash
   node setupProject.js
   ```
