// setupProject.js
const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();

const files = {
  'package.json': `{
  "name": "dex-ai-trading",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "start": "ts-node src/index.ts"
  },
  "dependencies": {
    "ethers": "^6.6.0",
    "@solana/web3.js": "^1.73.1"
  },
  "devDependencies": {
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}
`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
`,

  '.env': `# Example .env file
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHEREUM_PRIVATE_KEY=your_ethereum_private_key_here

SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=[array of 64 numbers, base58 or json format]
UNISWAP_ROUTER_ADDRESS=0x7a250d5630b4cf539739df2c5dacab7c2f1c1d40
`,

  'src/types.ts': `export type Chain = 'ethereum' | 'solana';

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
`,

  'src/utils/amm.ts': `export function getAmountOutConstantProduct(
  reserveIn: number,
  reserveOut: number,
  amountIn: number,
  feePercent = 0.003
): number {
  const amountInWithFee = amountIn * (1 - feePercent);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  const amountOut = numerator / denominator;
  return amountOut;
}
`,

  'src/adapters/ethUniswapAdapter.ts': `import { ethers } from 'ethers';

const ROUTER_ABI = [
  'function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) external returns (uint256[])',
];

export class EthUniswapAdapter {
  provider: ethers.providers.JsonRpcProvider;
  signer: ethers.Signer;
  router: ethers.Contract;

  constructor(rpcUrl: string, privateKey: string, routerAddress: string) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.router = new ethers.Contract(routerAddress, ROUTER_ABI, this.signer);
  }

  async approveIfNeeded(tokenAddr: string, amount: ethers.BigNumber) {
    const erc20Abi = [
      'function allowance(address owner, address spender) external view returns (uint256)',
      'function approve(address spender, uint256 amount) external returns (bool)',
    ];
    const tokenContract = new ethers.Contract(tokenAddr, erc20Abi, this.signer);
    const allowance = await tokenContract.allowance(await this.signer.getAddress(), this.router.address);
    if (allowance.lt(amount)) {
      const tx = await tokenContract.approve(this.router.address, ethers.constants.MaxUint256);
      await tx.wait();
    }
  }

  async swapExactTokensForTokens(
    amountIn: ethers.BigNumberish,
    amountOutMin: ethers.BigNumberish,
    path: string[],
    to: string,
    deadlineSecs = 300
  ) {
    await this.approveIfNeeded(path[0], ethers.BigNumber.from(amountIn));
    const deadline = Math.floor(Date.now() / 1000) + deadlineSecs;
    const tx = await this.router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline, {
      gasLimit: 1_000_000,
    });
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }
}
`,

  'src/adapters/solanaJupiterAdapter.ts': `import { Connection, Keypair } from '@solana/web3.js';

export class SolanaJupiterAdapter {
  conn: Connection;
  keypair: Keypair;

  constructor(rpcUrl: string, keypair: Keypair) {
    this.conn = new Connection(rpcUrl, 'confirmed');
    this.keypair = keypair;
  }

  async sendSwapTx(signedTxBase64: string) {
    const rawTx = Buffer.from(signedTxBase64, 'base64');
    const txid = await this.conn.sendRawTransaction(rawTx);
    await this.conn.confirmTransaction(txid, 'confirmed');
    return txid;
  }
}
`,

  'src/strategies/simpleMeanReversion.ts': `import { Strategy, IStrategyContext } from '../types';
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
`,

  'src/workers/backtester.ts': `import { Strategy, IStrategyContext, Bar, SwapSignal } from '../types';
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

      return \`sim-trade-\${Date.now()}\`;
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
`,

  'src/index.ts': `import { simpleMeanReversion } from './strategies/simpleMeanReversion';
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
`,
};

const folders = [
  'src',
  'src/adapters',
  'src/strategies',
  'src/workers',
  'src/utils',
];

async function writeFile(filepath, content) {
  return fs.promises.writeFile(filepath, content, 'utf8');
}

async function createFolders() {
  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    if (!fs.existsSync(folderPath)) {
      await fs.promises.mkdir(folderPath, { recursive: true });
      console.log(`Created folder: ${folder}`);
    }
  }
}

async function createFiles() {
  for (const [filename, content] of Object.entries(files)) {
    const filepath = path.join(baseDir, filename);
    const folder = path.dirname(filepath);
    if (!fs.existsSync(folder)) {
      await fs.promises.mkdir(folder, { recursive: true });
    }
    await writeFile(filepath, content);
    console.log(`Created file: ${filename}`);
  }
}

async function main() {
  console.log('Starting project setup...');
  await createFolders();
  await createFiles();
  console.log('Project setup complete! Run "npm install" and then "npm start" to begin.');
}

main().catch(err => {
  console.error('Error setting up project:', err);
});
