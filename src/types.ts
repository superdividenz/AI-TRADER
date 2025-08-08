export type Chain = 'ethereum' | 'solana';

export interface SwapSignal {
  chain: Chain;
  pair: string; // eg "ETH/USDC" or "SOL/USDC"
  direction: 'buy' | 'sell';
  amountIn: number;
  maxSlippagePct?: number;
}

export type Bar = {
  symbol: string;
  time: number; // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export interface IStrategyContext {
  chain: Chain;
  symbol: string;
  getPosition(symbol?: string): number;
  placeSwap(signal: SwapSignal): Promise<string>;
  simulate?: boolean; // true = no real txs, just simulation
}

export interface Strategy {
  initialize?(context: IStrategyContext, params?: any): Promise<void> | void;
  onBar(context: IStrategyContext, bar: Bar): Promise<void> | void;
}
