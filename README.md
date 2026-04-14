# StellarPoll — On-chain live poll built with Next.js 14 + Soroban

## Overview

StellarPoll is a decentralized voting application that demonstrates on-chain transaction handling, smart contract integration, and real-time blockchain synchronization. Built with Next.js 14 and Soroban smart contracts, this app satisfies Level 2 Yellow Belt requirements by implementing comprehensive error handling, contract deployment on Stellar testnet, transaction status visibility, and real-time event synchronization through polling.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (warm light-mode design system with Claude-inspired tokens)
- **@stellar/stellar-sdk** + **@creit.tech/stellar-wallets-kit** (wallet integration)
- **Soroban smart contract** (Rust, deployed on testnet)
- **Framer Motion** (animations)
- **React Icons** (UI icons)

## Level 2 Requirements Met

| Requirement | Status |
|-------------|--------|
| 3 error types handled | ✅ |
| Contract deployed on testnet | ✅ |
| Contract called from frontend | ✅ |
| Transaction status visible (pending → success / fail) | ✅ |
| Real-time event sync (10s polling) | ✅ |
| 2+ meaningful commits | ✅ |

## Error Handling

### WalletNotFoundError
Triggered when no Stellar wallet extension is installed in the browser. The app displays an alert prompting users to install Freighter or another compatible wallet.

```typescript
if (error instanceof WalletNotFoundError) {
  setWalletError('No Stellar wallet found. Please install Freighter or another wallet.');
}
```

### InsufficientBalanceError
Triggered when the connected account has less than 1.5 XLM, which is required to cover network fees for transactions on Stellar testnet.

```typescript
const balance = await stellar.getBalance(voterKey);
const xlmAmount = parseFloat(balance.xlm);
if (xlmAmount < 1.5) {
  throw new InsufficientBalanceError(
    `Insufficient XLM balance: ${xlmAmount} XLM (minimum 1.5 XLM required)`
  );
}
```

### WalletRejectedError
Triggered when the user dismisses or cancels the wallet signing modal during transaction approval.

```typescript
if (error.message?.includes('User rejected') || error.message?.includes('closed')) {
  throw new WalletRejectedError('User rejected signing');
}
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/senapati484/stellar-live-poll.git
   cd stellar-live-poll
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your deployed contract ID:
   ```
   NEXT_PUBLIC_CONTRACT_ID=your_contract_id_here
   NEXT_PUBLIC_NETWORK=testnet
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Install Freighter wallet**
   Download from [freighter.app](https://freighter.app) and set up a testnet account.

6. **Fund your testnet account**
   Use the [Stellar Friendbot](https://laboratory.stellar.org/#account-creator?network=test) to fund your account with testnet XLM.

## Deploying the Contract

The Soroban smart contract is located in `contracts/live_poll/`. To build and deploy:

```bash
cd contracts/live_poll
cargo build --target wasm32-unknown-unknown --release
```

See [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) for complete deployment instructions with step-by-step commands.

## Wallet Options Available

Supported via StellarWalletsKit (allowAllModules):
- Freighter
- xBull
- Albedo
- Rabet
- Lobstr
- Hana
- WalletConnect

<!-- SCREENSHOT PLACEHOLDER: wallet selection modal -->

## Deployed Contract

**Contract ID:** `[FILL IN AFTER DEPLOY]`

Verify on [Stellar Expert](https://stellar.expert/explorer/testnet/contract/[FILL IN])

## Transaction Hash

**Sample vote tx:** `[FILL IN AFTER INVOKE]`

Verify on [Stellar Expert](https://stellar.expert/explorer/testnet/tx/[FILL IN])

## Live Demo

[FILL IN — Vercel or Netlify URL]

## Project Structure

```
stellar-live-poll/
├── app/
│   ├── globals.css          # Tailwind directives and custom utility classes
│   ├── layout.tsx           # Root layout with font imports
│   └── page.tsx             # Main application page
├── components/
│   ├── ui.tsx               # Shared UI primitives (Button, Input, Alert, etc.)
│   ├── Navbar.tsx           # Sticky navigation with wallet connection
│   ├── PollCard.tsx         # Voting interface
│   ├── ResultsPanel.tsx     # Live results with real-time sync
│   └── AdminPanel.tsx       # Admin section for setting poll questions
├── lib/
│   ├── stellar-helper.ts    # Wallet and blockchain interaction layer
│   └── contract-client.ts   # Soroban contract wrapper
├── contracts/
│   └── live_poll/
│       ├── src/lib.rs       # Soroban smart contract (Rust)
│       └── Cargo.toml       # Contract dependencies
└── DEPLOY_GUIDE.md          # Contract deployment instructions
```

## Environment Variables
To run this project locally, ensure you define the following in your `.env.local`:

```
NEXT_PUBLIC_CONTRACT_ID=CC3GTRSOAEFTXKZVKMXOX4SJ66NU6CRVN5OP3F76WN5TVFLZBOEWIZDA
NEXT_PUBLIC_NETWORK=testnet
```

