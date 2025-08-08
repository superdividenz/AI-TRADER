import { Connection, Keypair } from '@solana/web3.js';

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
