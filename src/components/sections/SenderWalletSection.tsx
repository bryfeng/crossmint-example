"use client";

import { Wallet, Chain } from "@crossmint/wallets-sdk";
import { Balances } from "@/types/wallet";

type SenderWalletSectionProps = {
  isLoggedIn: boolean;
  senderWallet: Wallet<Chain> | null;
  senderBalances: Balances | null;
  loading: string | null;
  createSenderWallet: () => void;
  refreshSenderBalances: () => void;
};

export function SenderWalletSection({
  isLoggedIn,
  senderWallet,
  senderBalances,
  loading,
  createSenderWallet,
  refreshSenderBalances,
}: SenderWalletSectionProps) {
  return (
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
  );
}
