import { NextResponse } from "next/server";
import { CrossmintWallets, createCrossmint, Wallet, Chain } from "@crossmint/wallets-sdk";

// Initialize Crossmint with server-side key
const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_API_KEY!,
});
const wallets = CrossmintWallets.from(crossmint);

// Store wallet object in memory
let recipientWallet: Wallet<Chain> | null = null;
const CHAIN = "base-sepolia";

// POST - Create recipient wallet and return with balances
export async function POST() {
  try {
    console.log("Creating recipient wallet on server...");

    // Create new wallet if none exists
    if (!recipientWallet) {
      recipientWallet = await wallets.createWallet({
        chain: CHAIN,
        signer: { type: "api-key" },
      });
    }

    console.log(`Recipient wallet created: ${recipientWallet.address}`);

    // Fetch balances using SDK (faster than REST API)
    const balances = await recipientWallet.balances(["usdxm"]);

    return NextResponse.json({
      success: true,
      address: recipientWallet.address,
      chain: CHAIN,
      balances: {
        nativeToken: balances.nativeToken,
        usdc: balances.usdc,
        tokens: balances.tokens,
      },
    });
  } catch (error: any) {
    console.error("Failed to create recipient wallet:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get recipient wallet info and balances
export async function GET() {
  if (!recipientWallet) {
    return NextResponse.json(
      { success: false, error: "No recipient wallet created yet. Call POST first." },
      { status: 404 }
    );
  }

  try {
    // Fetch balances using SDK
    const balances = await recipientWallet.balances(["usdxm"]);

    return NextResponse.json({
      success: true,
      address: recipientWallet.address,
      chain: CHAIN,
      balances: {
        nativeToken: balances.nativeToken,
        usdc: balances.usdc,
        tokens: balances.tokens,
      },
    });
  } catch (error: any) {
    console.error("Failed to get recipient info:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
