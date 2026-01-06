"use client";

import { useState } from "react";
import { useCrossmint, useAuth } from "@crossmint/client-sdk-react-ui";
import { CrossmintWallets, Wallet, Chain } from "@crossmint/wallets-sdk";

type TokenBalance = {
  amount: string;
  symbol: string;
  name?: string;
};

type Balances = {
  nativeToken: TokenBalance;
  usdc: TokenBalance;
  tokens: TokenBalance[];
};

type RecipientInfo = {
  address: string;
  chain: string;
  balances?: {
    nativeToken: TokenBalance;
    usdc?: TokenBalance;
    tokens: TokenBalance[];
  };
};

export function WalletDemo() {
  const { crossmint } = useCrossmint();
  const { login, logout, user, status: authStatus } = useAuth();

  const isLoggedIn = authStatus === "logged-in";

  // Sender wallet (client-side, passkey)
  const [senderWallet, setSenderWallet] = useState<Wallet<Chain> | null>(null);
  const [senderBalances, setSenderBalances] = useState<Balances | null>(null);

  // Recipient wallet (server-side, api-key)
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);

  // UI state
  const [amount, setAmount] = useState("1");
  const [txResult, setTxResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Step 1: Create sender wallet (client-side with passkey)
  const createSenderWallet = async () => {
    setLoading("sender");
    setTxResult(null);
    try {
      const wallets = CrossmintWallets.from(crossmint);
      const wallet = await wallets.getOrCreateWallet({
        chain: "base-sepolia",
        signer: { type: "passkey" },
      });
      setSenderWallet(wallet);
      // Request balances including USDXM
      const bal = await wallet.balances(["usdxm"]);
      setSenderBalances({
        nativeToken: bal.nativeToken,
        usdc: bal.usdc,
        tokens: bal.tokens,
      });
    } catch (err: any) {
      setTxResult({ success: false, error: err.message });
    }
    setLoading(null);
  };

  // Step 2: Create recipient wallet (server-side with API key)
  const createRecipientWallet = async () => {
    setLoading("recipient");
    setTxResult(null);
    try {
      const res = await fetch("/api/recipient", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRecipient({ address: data.address, chain: data.chain });
      } else {
        setTxResult({ success: false, error: data.error });
      }
    } catch (err: any) {
      setTxResult({ success: false, error: err.message });
    }
    setLoading(null);
  };

  // Refresh sender balances
  const refreshSenderBalances = async () => {
    if (!senderWallet) return;
    setLoading("refreshSender");
    try {
      const bal = await senderWallet.balances(["usdxm"]);
      setSenderBalances({
        nativeToken: bal.nativeToken,
        usdc: bal.usdc,
        tokens: bal.tokens,
      });
    } catch (err) {
      console.error("Failed to refresh sender balances:", err);
    }
    setLoading(null);
  };

  // Refresh recipient balances
  const refreshRecipientBalances = async () => {
    if (!recipient) return;
    setLoading("refreshRecipient");
    try {
      const res = await fetch("/api/recipient");
      const data = await res.json();
      if (data.success) {
        setRecipient({
          ...recipient,
          balances: data.balances,
        });
      }
    } catch (err) {
      console.error("Failed to refresh recipient balances:", err);
    }
    setLoading(null);
  };

  // Step 3: Fund sender wallet
  const fundSenderWallet = async () => {
    if (!senderWallet) return;
    setLoading("fund");
    setTxResult(null);

    try {
      // Step 1: Get sender's current USDXM balance before funding
      const preBal = await senderWallet.balances(["usdxm"]);
      const usdxmToken = preBal.tokens.find(
        (t) => t.symbol.toLowerCase() === "usdxm"
      );
      const currentSenderUsdxm = usdxmToken ? parseFloat(usdxmToken.amount) : 0;
      const fundAmount = 10;
      const expectedBalance = currentSenderUsdxm + fundAmount;
      console.log(`Current sender USDXM: ${currentSenderUsdxm}, Expected after fund: ${expectedBalance}`);

      // Step 2: Fund the wallet
      await senderWallet.stagingFund(fundAmount, "base-sepolia");
      setTxResult({
        success: true,
        type: "fund",
        amount: fundAmount,
      });

      // Step 3: Poll sender balance until it reaches expected amount (max 10 attempts)
      setLoading("refreshSender");
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const bal = await senderWallet.balances(["usdxm"]);
        setSenderBalances({
          nativeToken: bal.nativeToken,
          usdc: bal.usdc,
          tokens: bal.tokens,
        });
        const newUsdxm = bal.tokens.find(
          (t) => t.symbol.toLowerCase() === "usdxm"
        );
        const newBalance = newUsdxm ? parseFloat(newUsdxm.amount) : 0;
        console.log(`Poll ${i + 1}: Sender USDXM balance = ${newBalance}, expected = ${expectedBalance}`);
        if (newBalance >= expectedBalance) {
          console.log("Sender balance updated successfully!");
          break;
        }
      }
    } catch (err: any) {
      setTxResult({ success: false, error: err.message });
    }
    setLoading(null);
  };

  // Step 4: Send transaction
  const sendTransaction = async () => {
    if (!senderWallet || !recipient) return;
    setLoading("send");
    setTxResult(null);

    try {
      // Step 1: Get recipient's current USDXM balance before sending
      const preRes = await fetch("/api/recipient");
      const preData = await preRes.json();
      let currentRecipientUsdxm = 0;
      if (preData.success && preData.balances) {
        const usdxmToken = preData.balances.tokens.find(
          (t: TokenBalance) => t.symbol.toLowerCase() === "usdxm"
        );
        currentRecipientUsdxm = usdxmToken ? parseFloat(usdxmToken.amount) : 0;
      }
      const expectedBalance = currentRecipientUsdxm + parseFloat(amount);
      console.log(`Current recipient USDXM: ${currentRecipientUsdxm}, Expected after send: ${expectedBalance}`);

      // Step 2: Send the transaction
      const tx = await senderWallet.send(recipient.address, "usdxm", amount);
      setTxResult({
        success: true,
        type: "send",
        hash: tx.hash,
        explorerLink: tx.explorerLink,
        amount: amount,
      });

      // Step 3: Refresh sender balance immediately
      const senderBal = await senderWallet.balances(["usdxm"]);
      setSenderBalances({
        nativeToken: senderBal.nativeToken,
        usdc: senderBal.usdc,
        tokens: senderBal.tokens,
      });

      // Step 4: Poll recipient balance until it reaches expected amount (max 10 attempts)
      setLoading("refreshRecipient");
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 2000)); // Wait 2s between attempts
        const res = await fetch("/api/recipient");
        const data = await res.json();
        if (data.success) {
          setRecipient({
            ...recipient,
            balances: data.balances,
          });
          // Check if USDXM balance has reached expected amount
          const usdxmToken = data.balances.tokens.find(
            (t: TokenBalance) => t.symbol.toLowerCase() === "usdxm"
          );
          const newBalance = usdxmToken ? parseFloat(usdxmToken.amount) : 0;
          console.log(`Poll ${i + 1}: Recipient USDXM balance = ${newBalance}, expected = ${expectedBalance}`);
          if (newBalance >= expectedBalance) {
            console.log("Recipient balance updated successfully!");
            break;
          }
        }
      }
    } catch (err: any) {
      setTxResult({ success: false, error: err.message });
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Crossmint Wallet Demo</h1>
          <p className="text-slate-400">
            Client-side Passkey Wallet → Server-side API Wallet
          </p>
        </header>

        {/* Step 0: Sign In */}
        <section className="bg-white/10 rounded-xl p-6 mb-4 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-cyan-400 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
              0
            </span>
            <h2 className="text-lg font-semibold">Sign In</h2>
          </div>

          {!isLoggedIn ? (
            <div>
              <p className="text-slate-300 mb-4">
                Sign in to create a passkey-secured wallet
              </p>
              <button
                onClick={() => login()}
                disabled={authStatus === "in-progress"}
                className="bg-cyan-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50 w-full"
              >
                {authStatus === "in-progress" ? "Signing in..." : "Sign In with Email"}
              </button>
            </div>
          ) : (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-400 font-semibold">✓ Signed In</p>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Step 1: Sender Wallet (Client-side) */}
        <section className={`bg-white/10 rounded-xl p-6 mb-4 backdrop-blur ${!isLoggedIn ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-cyan-400 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
              1
            </span>
            <h2 className="text-lg font-semibold">Sender Wallet (Client-side)</h2>
          </div>

          {!senderWallet ? (
            <div>
              <p className="text-slate-300 mb-4">
                Create a self-custody wallet secured by your device&apos;s passkey
              </p>
              <button
                onClick={createSenderWallet}
                disabled={!isLoggedIn || loading === "sender"}
                className="bg-cyan-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50 w-full"
              >
                {loading === "sender" ? "Creating..." : "Create Passkey Wallet"}
              </button>
            </div>
          ) : (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-semibold mb-2">✓ Wallet Created</p>
              <p className="text-xs text-slate-400 mb-1">ADDRESS</p>
              <p className="text-cyan-400 font-mono text-sm break-all">{senderWallet.address}</p>

              {senderBalances && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">BALANCES</p>
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {senderBalances.nativeToken.amount} {senderBalances.nativeToken.symbol.toUpperCase()}
                        </p>
                        {senderBalances.usdc && parseFloat(senderBalances.usdc.amount) > 0 && (
                          <p className="text-cyan-400">
                            {senderBalances.usdc.amount} {senderBalances.usdc.symbol.toUpperCase()}
                          </p>
                        )}
                        {senderBalances.tokens.map((t, i) => (
                          <p key={i} className="text-cyan-400 font-semibold">
                            {t.amount} {t.symbol.toUpperCase()}
                          </p>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={refreshSenderBalances}
                      disabled={loading === "refreshSender"}
                      className="text-sm text-slate-400 hover:text-white disabled:opacity-50"
                    >
                      {loading === "refreshSender" ? "..." : "↻ Refresh"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Step 2: Recipient Wallet (Server-side) */}
        <section className={`bg-white/10 rounded-xl p-6 mb-4 backdrop-blur ${!senderWallet ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-cyan-400 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
              2
            </span>
            <h2 className="text-lg font-semibold">Recipient Wallet (Server-side)</h2>
          </div>

          {!recipient ? (
            <div>
              <p className="text-slate-300 mb-4">
                Create a recipient wallet on the server using API key authentication
              </p>
              <button
                onClick={createRecipientWallet}
                disabled={!senderWallet || loading === "recipient"}
                className="bg-cyan-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50 w-full"
              >
                {loading === "recipient" ? "Creating..." : "Create Server Wallet"}
              </button>
            </div>
          ) : (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-semibold mb-2">✓ Wallet Created</p>
              <p className="text-xs text-slate-400 mb-1">ADDRESS</p>
              <p className="text-cyan-400 font-mono text-sm break-all">{recipient.address}</p>

              {recipient.balances && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">BALANCES</p>
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {recipient.balances.nativeToken.amount} {recipient.balances.nativeToken.symbol.toUpperCase()}
                        </p>
                        {recipient.balances.usdc && parseFloat(recipient.balances.usdc.amount) > 0 && (
                          <p className="text-cyan-400">
                            {recipient.balances.usdc.amount} {recipient.balances.usdc.symbol.toUpperCase()}
                          </p>
                        )}
                        {recipient.balances.tokens.map((t, i) => (
                          <p key={i} className="text-cyan-400 font-semibold">
                            {t.amount} {t.symbol.toUpperCase()}
                          </p>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={refreshRecipientBalances}
                      disabled={loading === "refreshRecipient"}
                      className="text-sm text-slate-400 hover:text-white disabled:opacity-50"
                    >
                      {loading === "refreshRecipient" ? "..." : "↻ Refresh"}
                    </button>
                  </div>
                </div>
              )}

              {!recipient.balances && (
                <button
                  onClick={refreshRecipientBalances}
                  disabled={loading === "refreshRecipient"}
                  className="mt-3 text-sm text-slate-400 hover:text-white disabled:opacity-50"
                >
                  {loading === "refreshRecipient" ? "Loading..." : "Load balances"}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Step 3: Fund Sender */}
        <section className={`bg-white/10 rounded-xl p-6 mb-4 backdrop-blur ${!recipient ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-cyan-400 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
              3
            </span>
            <h2 className="text-lg font-semibold">Fund Sender Wallet</h2>
          </div>
          <p className="text-slate-300 mb-4">Get test USDXM tokens (staging only)</p>
          <button
            onClick={fundSenderWallet}
            disabled={!recipient || loading === "fund"}
            className="bg-cyan-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50 w-full"
          >
            {loading === "fund" ? "Funding..." : "Get 10 USDXM"}
          </button>
        </section>

        {/* Step 4: Send Transaction */}
        <section className={`bg-white/10 rounded-xl p-6 mb-4 backdrop-blur ${!recipient ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-cyan-400 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
              4
            </span>
            <h2 className="text-lg font-semibold">Send Transaction</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">TO (SERVER WALLET)</p>
              <p className="font-mono text-sm text-cyan-400 break-all">
                {recipient?.address || "Create recipient first"}
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">AMOUNT (USDXM)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white"
                placeholder="1"
              />
            </div>

            <button
              onClick={sendTransaction}
              disabled={!recipient || loading === "send"}
              className="bg-cyan-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50 w-full"
            >
              {loading === "send" ? "Sending..." : "Send USDXM"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Gas fees are sponsored by Crossmint
            </p>
          </div>
        </section>

        {/* Result */}
        {txResult && (
          <section className="bg-white/10 rounded-xl p-6 backdrop-blur">
            <h2 className="text-lg font-semibold mb-4">Result</h2>
            {txResult.success ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 font-semibold mb-2">
                  ✓ {txResult.type === "fund" ? `Funded ${txResult.amount} USDXM!` : `Sent ${txResult.amount} USDXM!`}
                </p>
                {txResult.type === "fund" && (
                  <p className="text-sm text-slate-300 mb-3">
                    {loading === "refreshSender"
                      ? "⏳ Waiting for sender balance to update..."
                      : "✓ Sender balance updated - check above!"}
                  </p>
                )}
                {txResult.type === "send" && (
                  <p className="text-sm text-slate-300 mb-3">
                    {loading === "refreshRecipient"
                      ? "⏳ Waiting for recipient balance to update..."
                      : "✓ Recipient balance updated - check above!"}
                  </p>
                )}
                {txResult.hash && (
                  <>
                    <p className="text-xs text-slate-400">HASH</p>
                    <p className="font-mono text-sm break-all mb-2">{txResult.hash}</p>
                  </>
                )}
                {txResult.txId && (
                  <>
                    <p className="text-xs text-slate-400">TX ID</p>
                    <p className="font-mono text-sm break-all mb-2">{txResult.txId}</p>
                  </>
                )}
                {txResult.explorerLink && (
                  <a
                    href={txResult.explorerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline text-sm"
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold">✗ Failed</p>
                <p className="text-sm mt-1">{txResult.error}</p>
              </div>
            )}
          </section>
        )}

        <footer className="text-center text-slate-500 text-sm mt-8">
          Powered by Crossmint | Base Sepolia Testnet
        </footer>
      </div>
    </div>
  );
}
