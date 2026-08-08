# AgentVault — Autonomous Multi-Agent Treasury & x402 Micropayment Economy

## Problem
As AI agents become more autonomous, they need programmable, policy-gated treasuries to participate in the machine economy. Traditional wallets are designed for humans, not for automated micro-transactions (x402) gated by strict programmatic rules.

## Solution
AgentVault provides an Anchor-based smart contract for managing agent treasuries with spend caps, freeze authorities, and policy levels. The client SDK includes middleware for Express servers to easily monetize API endpoints using x402 micropayments on Solana.

## Architecture

```text
+-------------------+       x402 Headers       +-------------------+
|                   |  --------------------->  |                   |
|   Agent (Client)  |                          | x402 Gateway API  |
|                   |  <---------------------  |                   |
+--------+----------+       402/200 OK         +---------+---------+
         |                                               |
         | SDK executePayment()                          | verify payment
         v                                               v
+------------------------------------------------------------------+
|                          Solana Network                          |
|                                                                  |
|   +-------------------+              +-----------------------+   |
|   |   AgentVault PDA  |              | Destination (API fee) |   |
|   +-------------------+              +-----------------------+   |
+------------------------------------------------------------------+
```

## How x402 micropayments work with Solana
When an agent calls a gated API, the gateway responds with HTTP 402 Payment Required and the price. The agent executes a micro-transaction on Solana via the AgentVault program (which checks spend limits). The agent resends the request with the `X-Payment` header containing the transaction signature. The gateway verifies the signature on-chain and serves the response.

## Anchor Program Structure
- `initialize_vault(name, spend_cap, policy_level)`
- `execute_payment(amount, recipient, memo)`
- `freeze_vault()`
- `unfreeze_vault()`
- `update_policy(new_spend_cap, new_policy_level)`

## How to run locally
1. Clone the repo and run `npm install`
2. Start the gateway server: `node gateway/x402Server.js`
3. Open `http://localhost:3001/dashboard` to view the Agent Economy Dashboard

## Live Demo
[Live Demo Link Placeholder]
