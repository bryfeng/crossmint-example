"use client";

import { Wallet, Chain } from "@crossmint/wallets-sdk";
import { RecipientInfo } from "@/types/wallet";

type RecipientWalletSectionProps = {
  senderWallet: Wallet<Chain> | null;
  recipient: RecipientInfo | null;
  loading: string | null;
  createRecipientWallet: () => void;
  refreshRecipientBalances: () => void;
};

export function RecipientWalletSection({
  senderWallet,
  recipient,
  loading,
  createRecipientWallet,
  refreshRecipientBalances,
}: RecipientWalletSectionProps) {
  return (
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
  );
}
