"use client";

import { TxResult } from "@/types/wallet";

type TransactionResultProps = {
  txResult: TxResult | null;
  loading: string | null;
};

export function TransactionResult({
  txResult,
  loading,
}: TransactionResultProps) {
  if (!txResult) return null;

  return (
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
  );
}
