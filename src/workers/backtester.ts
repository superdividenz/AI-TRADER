import { Strategy, IStrategyContext, Bar, SwapSignal } from '../types';
import { getAmountOutConstantProduct } from '../utils/amm';

type Position = {
  size: number;
  avgPrice: number;
};

export class Backtester {
  private strategy: Strategy;
  private bars: Bar[];
  private position: Position = { size: 0, avgPrice: 0 };
  private cash = 1000; // start with 1000 USDC or stable coin
  private feePercent = 0.003;
  private reserveIn: number;
  private reserveOut: number;

  constructor(strategy: Strategy, bars: Bar[], initialReserves: { reserveIn: number; reserveOut: number }) {
    this.strategy = strategy;
    this.bars = bars;
    this.reserveIn = initialReserves.reserveIn;
    this.reserveOut = initialReserves.reserveOut;
  }

  private context: IStrategyContext = {
    chain: 'ethereum',
    symbol: 'ETH/USDC',
    getPosition: () => this.position.size,
    placeSwap: async (signal: SwapSignal) => {
      const amountIn = signal.amountIn;
      const amountOut = getAmountOutConstantProduct(this.reserveIn, this.reserveOut, amountIn, this.feePercent);

      if (signal.direction === 'buy') {
        if (this.cash < amountOut) throw new Error('Insufficient cash');
        this.cash -= amountOut;
        const totalCost = this.position.avgPrice * this.position.size + amountOut;
        this.position.size += amountIn;
        this.position.avgPrice = totalCost / this.position.size;
      } else {
        if (this.position.size < amountIn) throw new Error('Insufficient position');
        this.position.size -= amountIn;
        this.cash += amountOut;
      }

      if (signal.direction === 'buy') {
        this.reserveIn += amountIn;
        this.reserveOut -= amountOut;
      } else {
        this.reserveIn -= amountIn;
        this.reserveOut += amountOut;
      }

      return `sim-trade-${Date.now()}`;
    },
    simulate: true,
  };

  async run() {
    if (this.strategy.initialize) await this.strategy.initialize(this.context);

    for (const bar of this.bars) {
      await this.strategy.onBar(this.context, bar);
    }

    const lastPrice = this.bars[this.bars.length - 1].close;
    const equity = this.cash + this.position.size * lastPrice;

    return {
      finalEquity: equity,
      position: this.position,
      cash: this.cash,
    };
  }
}
