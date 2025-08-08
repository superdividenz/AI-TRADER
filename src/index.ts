import { simpleMeanReversion } from './strategies/simpleMeanReversion';
import { Backtester } from './workers/backtester';

const bars = [
  { symbol: 'ETH/USDC', time: 0, open: 1900, high: 1950, low: 1850, close: 1920, volume: 1000 },
  { symbol: 'ETH/USDC', time: 1, open: 1920, high: 1930, low: 1880, close: 1890, volume: 800 },
  { symbol: 'ETH/USDC', time: 2, open: 1890, high: 1900, low: 1800, close: 1820, volume: 600 },
];

async function main() {
  const backtester = new Backtester(simpleMeanReversion, bars, { reserveIn: 1000, reserveOut: 2000000 });
  const results = await backtester.run();

  console.log('Backtest results:', results);
}

main().catch(console.error);
