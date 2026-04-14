# Soroban Live Poll Contract Deployment Guide

This guide walks you through deploying the `live_poll` Soroban smart contract to the Stellar testnet.

## Prerequisites

- macOS or Linux
- Rust and Cargo installed
- Node.js and npm installed (for the frontend)

---

## Step 1: Install Stellar CLI

Install the Stellar CLI using the official installer script:

```bash
curl -fsSL https://raw.githubusercontent.com/stellar/stellar-cli/main/install.sh | sh
```

Verify the installation:

```bash
stellar --version
```

**Expected Output:**
```
stellar-cli 21.x.x
```

---

## Step 2: Generate and Fund a Deploy Keypair

Generate a new keypair named `deployer` for the testnet:

```bash
stellar keys generate --global deployer --network testnet
```

Display the deployer address:

```bash
stellar keys address deployer
```

**Expected Output:**
```
GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Fund the deployer account using Friendbot (testnet faucet):

```bash
curl "https://friendbot.stellar.org?addr=$(stellar keys address deployer)"
```

**Expected Output:**
```json
{
  "hash": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "ledger": 12345,
  "successful": true,
  "paging_token": "12345678901234567"
}
```

---

## Step 3: Build the Contract

Build the contract to WebAssembly:

```bash
cargo build --target wasm32-unknown-unknown --release \
  --manifest-path contracts/live_poll/Cargo.toml
```

**Expected Output:**
```
   Compiling live_poll v0.1.0 (/path/to/stellar-live-poll/contracts/live_poll)
    Finished release [optimized] target(s) in XX.XXs
```

Verify the WASM file was created:

```bash
ls -lh target/wasm32-unknown-unknown/release/live_poll.wasm
```

**Expected Output:**
```
-rwxr-xr-x  1 user  staff   XXK Jan 1 12:00 target/wasm32-unknown-unknown/release/live_poll.wasm
```

---

## Step 4: Deploy and Capture CONTRACT_ID

Deploy the contract to testnet and save the contract ID:

```bash
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/live_poll.wasm \
  --source deployer \
  --network testnet)
echo "CONTRACT_ID=$CONTRACT_ID"
echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" >> .env.local
```

**Expected Output:**
```
CONTRACT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

The contract ID is automatically saved to `.env.local` for the frontend to use.

---

## Step 5: Seed Initial Data

Set the initial poll question:

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- set_question \
  --question "Which Stellar feature excites you most?"
```

**Expected Output:**
```
{
  "result": {
    "status": "SUCCESS"
  },
  "transactionId": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

Cast a test vote:

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- vote \
  --option "Smart Contracts"
```

**Expected Output:**
```
{
  "result": {
    "status": "SUCCESS"
  },
  "transactionId": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

---

## Verification

### Verify on Stellar Expert Explorer

1. Open https://stellar.expert/explorer/testnet
2. Search for your deployer address from Step 2
3. You should see:
   - The contract deployment transaction
   - The `set_question` transaction
   - The `vote` transaction

### Verify Contract Functionality

Check the current question:

```bash
stellar contract read \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_question
```

**Expected Output:**
```
"Which Stellar feature excites you most?"
```

Check vote results:

```bash
stellar contract read \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_results
```

**Expected Output:**
```
[
  ["Smart Contracts", 1]
]
```

---

## Next Steps

1. Copy the contract ID from `.env.local` or the deployment output
2. Update your frontend to use the deployed contract
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## Troubleshooting

**Friendbot fails:**
- Wait a few minutes and try again (rate limiting)
- Ensure you're on testnet, not mainnet

**Build fails:**
- Ensure Rust is installed: `rustc --version`
- Install wasm32 target: `rustup target add wasm32-unknown-unknown`

**Deploy fails:**
- Verify the deployer account is funded
- Check you have sufficient XLM for transaction fees
