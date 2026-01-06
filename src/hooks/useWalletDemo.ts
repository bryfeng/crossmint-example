"use client";

import { useState } from "react";
import { useCrossmint, useAuth } from "@crossmint/client-sdk-react-ui";
import { CrossmintWallets, Wallet, Chain } from "@crossmint/wallets-sdk";
import { Balances, RecipientInfo, TxResult, TokenBalance } from "@/types/wallet";

export function useWalletDemo() {
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
  const [txResult, setTxResult] = useState<TxResult | null>(null);
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
        // POST now returns balances, so we don't need a separate call
        setRecipient({
          address: data.address,
          chain: data.chain,
          balances: data.balances,
        });
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

  return {
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
  };
}
