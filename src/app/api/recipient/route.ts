import { NextResponse } from "next/server";
import { CrossmintWallets, createCrossmint } from "@crossmint/wallets-sdk";

// Initialize Crossmint with server-side key
const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_API_KEY!,
});
const wallets = CrossmintWallets.from(crossmint);

// Fixed linkedUser for demo - ensures we always get the same wallet back
// In production, use a real user ID from your auth system
const DEMO_LINKED_USER = "demo-recipient-wallet";

// Helper to get or create the recipient wallet (idempotent with linkedUser)
async function getRecipientWallet() {
  return await wallets.getOrCreateWallet({
    chain: "base-sepolia",
    signer: { type: "api-key" },
    linkedUser: `user:${DEMO_LINKED_USER}`,
  });
}

// POST - Create recipient wallet
export async function POST() {
  try {
    console.log("Creating recipient wallet on server...");

    const recipientWallet = await getRecipientWallet();

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
  try {
    // getOrCreateWallet is idempotent - returns same wallet for same linkedUser
    const recipientWallet = await getRecipientWallet();

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
