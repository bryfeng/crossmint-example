export type TokenBalance = {
  amount: string;
  symbol: string;
  name?: string;
};

export type Balances = {
  nativeToken: TokenBalance;
  usdc: TokenBalance;
  tokens: TokenBalance[];
};

export type RecipientInfo = {
  address: string;
  chain: string;
  balances?: {
    nativeToken: TokenBalance;
    usdc?: TokenBalance;
    tokens: TokenBalance[];
  };
};

export type TxResult = {
  success: boolean;
  type?: "fund" | "send";
  error?: string;
  hash?: string;
  explorerLink?: string;
  amount?: string | number;
  txId?: string;
};
