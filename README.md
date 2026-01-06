# Crossmint Wallet Demo

A Next.js demo application showcasing Crossmint's wallet SDK integration, including:

- **Client-side passkey wallet** (self-custody with biometric authentication)
- **Server-side API wallet** (custodial wallet using API key)
- **Token transfers** with gas sponsorship

## Features

| Feature | Description |
|---------|-------------|
| Passkey Authentication | Create self-custody wallets secured by Touch ID, Face ID, or Windows Hello |
| Server-side Wallets | Create custodial wallets using API key authentication |
| USDXM Funding | Fund wallets with test tokens (staging environment) |
| Token Transfers | Send USDXM between wallets with sponsored gas fees |
| Real-time Balance Updates | Automatic polling to show balance changes |

## Demo Flow

1. **Sign In** - Authenticate via email or Google
2. **Create Sender Wallet** - Client-side passkey wallet (self-custody)
3. **Create Recipient Wallet** - Server-side API wallet (custodial)
4. **Fund Sender** - Get 10 USDXM test tokens
5. **Send Transaction** - Transfer USDXM from sender to recipient
6. **Verify** - Watch recipient balance update automatically

## Getting Started

### Prerequisites

- Node.js 18+
- Crossmint account with API keys

### Get Your API Keys

1. Go to the [Crossmint Console](https://www.crossmint.com/console)
2. Navigate to the **Overview** section in your project
3. Copy your API keys:
   - **Client-side key** (`ck_staging_...` or `ck_production_...`) - Safe to expose in browser
   - **Server-side key** (`sk_staging_...` or `sk_production_...`) - Keep secret, use only on server

> **Note:** Use `staging` keys for development/testing and `production` keys for live deployments.

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Client-side key (exposed to browser)
NEXT_PUBLIC_CROSSMINT_API_KEY=ck_staging_...

# Server-side key (kept secret, server-only)
CROSSMINT_SERVER_API_KEY=sk_staging_...
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── recipient/
│   │       └── route.ts      # Server-side wallet API
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Main page
│   └── globals.css
├── components/
│   ├── CrossmintProviderWrapper.tsx  # Crossmint context provider
│   └── WalletDemo.tsx                # Main demo component
```

## API Routes

### `POST /api/recipient`
Creates a new server-side wallet using API key authentication.

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "chain": "base-sepolia"
}
```

### `GET /api/recipient`
Gets recipient wallet info and balances.

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "chain": "base-sepolia",
  "balances": {
    "nativeToken": { "amount": "0", "symbol": "eth" },
    "usdc": { "amount": "0", "symbol": "usdc" },
    "tokens": [{ "amount": "10", "symbol": "usdxm" }]
  }
}
```

## Key SDK Usage

### Client-side Passkey Wallet
```typescript
import { useCrossmint } from "@crossmint/client-sdk-react-ui";
import { CrossmintWallets } from "@crossmint/wallets-sdk";

const { crossmint } = useCrossmint();
const wallets = CrossmintWallets.from(crossmint);

const wallet = await wallets.getOrCreateWallet({
  chain: "base-sepolia",
  signer: { type: "passkey" },
});
```

### Server-side API Wallet
```typescript
import { CrossmintWallets, createCrossmint } from "@crossmint/wallets-sdk";

const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_API_KEY,
});
const wallets = CrossmintWallets.from(crossmint);

const wallet = await wallets.createWallet({
  chain: "base-sepolia",
  signer: { type: "api-key" },
});
```

### Funding (Staging Only)
```typescript
await wallet.stagingFund(10, "base-sepolia");
```

### Sending Tokens
```typescript
const tx = await wallet.send(recipientAddress, "usdxm", "1");
// Returns: { hash, explorerLink, transactionId }
```

### Checking Balances
```typescript
const balances = await wallet.balances(["usdxm"]);
// Returns: { nativeToken, usdc, tokens }
```

## Chain Support

This demo uses **Base Sepolia** (testnet). The SDK supports:

**Testnets:** base-sepolia, ethereum-sepolia, polygon-amoy, arbitrum-sepolia, optimism-sepolia, and more

**Mainnets:** base, ethereum, polygon, arbitrum, optimism, and more

## Resources

- [Crossmint Documentation](https://docs.crossmint.com)
- [Wallets SDK Reference](https://docs.crossmint.com/wallets/quickstart)
- [Crossmint SDK](https://github.com/Crossmint/crossmint-sdk)

Additional Questions please contact Bryan Feng @bryfeng on telegram

## License

MIT
