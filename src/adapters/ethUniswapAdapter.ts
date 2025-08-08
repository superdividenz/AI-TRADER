import { ethers } from 'ethers';

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
