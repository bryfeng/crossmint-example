"use client";

import { RecipientInfo } from "@/types/wallet";

type FundSectionProps = {
  recipient: RecipientInfo | null;
  loading: string | null;
  fundSenderWallet: () => void;
};

export function FundSection({
  recipient,
  loading,
  fundSenderWallet,
}: FundSectionProps) {
  return (
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
  );
}
