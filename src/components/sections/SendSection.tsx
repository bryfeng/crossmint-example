"use client";

import { RecipientInfo } from "@/types/wallet";

type SendSectionProps = {
  recipient: RecipientInfo | null;
  amount: string;
  loading: string | null;
  setAmount: (amount: string) => void;
  sendTransaction: () => void;
};

export function SendSection({
  recipient,
  amount,
  loading,
  setAmount,
  sendTransaction,
}: SendSectionProps) {
  return (
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
  );
}
