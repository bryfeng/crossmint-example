"use client";

import { useWalletDemo } from "@/hooks/useWalletDemo";
import {
  SignInSection,
  SenderWalletSection,
  RecipientWalletSection,
  FundSection,
  SendSection,
  TransactionResult,
} from "./sections";

export function WalletDemo() {
  const {
    // Auth
    isLoggedIn,
    authStatus,
    user,
    login,
    logout,
    // Sender wallet
    senderWallet,
    senderBalances,
    createSenderWallet,
    refreshSenderBalances,
    // Recipient wallet
    recipient,
    createRecipientWallet,
    refreshRecipientBalances,
    // Transaction
    amount,
    setAmount,
    fundSenderWallet,
    sendTransaction,
    // UI state
    txResult,
    loading,
  } = useWalletDemo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Crossmint Wallet Demo</h1>
          <p className="text-slate-400">
            Client-side Passkey Wallet → Server-side API Wallet
          </p>
        </header>

        <SignInSection
          isLoggedIn={isLoggedIn}
          authStatus={authStatus}
          user={user}
          login={login}
          logout={logout}
        />

        <SenderWalletSection
          isLoggedIn={isLoggedIn}
          senderWallet={senderWallet}
          senderBalances={senderBalances}
          loading={loading}
          createSenderWallet={createSenderWallet}
          refreshSenderBalances={refreshSenderBalances}
        />

        <RecipientWalletSection
          senderWallet={senderWallet}
          recipient={recipient}
          loading={loading}
          createRecipientWallet={createRecipientWallet}
          refreshRecipientBalances={refreshRecipientBalances}
        />

        <FundSection
          recipient={recipient}
          loading={loading}
          fundSenderWallet={fundSenderWallet}
        />

        <SendSection
          recipient={recipient}
          amount={amount}
          loading={loading}
          setAmount={setAmount}
          sendTransaction={sendTransaction}
        />

        <TransactionResult txResult={txResult} loading={loading} />

        <footer className="text-center text-slate-500 text-sm mt-8">
          Powered by Crossmint | Base Sepolia Testnet
        </footer>
      </div>
    </div>
  );
}
