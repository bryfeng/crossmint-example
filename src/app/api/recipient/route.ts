import { NextResponse } from "next/server";
import { CrossmintWallets, createCrossmint, Wallet, Chain } from "@crossmint/wallets-sdk";

// Initialize Crossmint with server-side key
const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_API_KEY!,
});
const wallets = CrossmintWallets.from(crossmint);

// Store wallet in memory (persists across requests in same server instance)
let recipientWallet: Wallet<Chain> | null = null;

// POST - Create recipient wallet
export async function POST() {
  try {
    console.log("Creating recipient wallet on server...");

    // Create new wallet if none exists, otherwise return existing
    if (!recipientWallet) {
      recipientWallet = await wallets.createWallet({
        chain: "base-sepolia",
        signer: { type: "api-key" },
      });
    }

    console.log(`Recipient wallet created: ${recipientWallet.address}`);

    return NextResponse.json({
      success: true,
      address: recipientWallet.address,
      chain: recipientWallet.chain,
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
    // Request balances including USDXM
    const balances = await recipientWallet.balances(["usdxm"]);

    return NextResponse.json({
      success: true,
      address: recipientWallet.address,
      chain: recipientWallet.chain,
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
