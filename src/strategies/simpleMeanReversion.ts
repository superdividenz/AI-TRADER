import { Strategy, IStrategyContext } from '../types';
import { getAmountOutConstantProduct } from '../utils/amm';

export const simpleMeanReversion: Strategy = {
  async initialize(ctx: IStrategyContext) {
    (ctx as any)._history = [];
  },

  async onBar(ctx: IStrategyContext, bar) {
    const h = (ctx as any)._history as number[];
    h.push(bar.close);
    if (h.length > 20) h.shift();
    if (h.length < 10) return;

    const avg = h.reduce((a, b) => a + b, 0) / h.length;
    const diff = (bar.close - avg) / avg;

    if (diff > 0.01 && ctx.getPosition() > 0) {
      await ctx.placeSwap({
        chain: ctx.chain,
        pair: ctx.symbol,
        direction: 'sell',
        amountIn: Math.abs(ctx.getPosition()),
        maxSlippagePct: 0.5,
      });
    } else if (diff < -0.01 && ctx.getPosition() === 0) {
      await ctx.placeSwap({
        chain: ctx.chain,
        pair: ctx.symbol,
        direction: 'buy',
        amountIn: 1,
        maxSlippagePct: 0.5,
      });
    }
  },
};
