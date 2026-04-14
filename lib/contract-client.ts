import { stellar } from './stellar-helper';
import {
  WalletRejectedError,
  InsufficientBalanceError,
} from './stellar-helper';
import { Networks, rpc, TransactionBuilder, Contract, scValToNative, nativeToScVal } from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';

const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const networkPassphrase = Networks.TESTNET;

export class ContractClient {
  private contractId: string;

  constructor() {
    const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID;
    if (!CONTRACT_ID) {
      throw new Error('NEXT_PUBLIC_CONTRACT_ID is not set');
    }
    this.contractId = CONTRACT_ID;
  }

  async setQuestion(adminKey: string, question: string): Promise<string> {
    try {
      const contract = new Contract(this.contractId);
      const helper = stellar();
      
      const sourceAccount = await helper.getRecentTransactions(adminKey, 1).catch(() => null).then(async () => {
         const account = await server.getAccount(adminKey);
         return account;
      });

      const tx = new TransactionBuilder(sourceAccount, {
        fee: '10000',
        networkPassphrase,
      })
        .addOperation(contract.call('set_question', nativeToScVal(question, { type: 'string' })))
        .setTimeout(300)
        .build();

      const simResult = await server.simulateTransaction(tx);
      const preparedTx = rpc.assembleTransaction(tx, simResult).build();

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(preparedTx.toXDR(), {
        networkPassphrase,
        address: adminKey,
      });

      const sendResult = await server.sendTransaction(TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase));
      if (sendResult.errorResult) {
        throw new Error('Transaction submission failed');
      }

      let txStatus = await server.getTransaction(sendResult.hash);
      while (txStatus.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        txStatus = await server.getTransaction(sendResult.hash);
      }
      return sendResult.hash;
    } catch (error: any) {
      if (error.message?.includes('User rejected') || error.message?.includes('closed')) {
        throw new WalletRejectedError('User rejected signing');
      }
      throw error;
    }
  }

  async getQuestion(): Promise<string> {
    try {
      const contract = new Contract(this.contractId);
      // Construct a faux transaction for simulation
      const tx = new TransactionBuilder({ accountId: () => 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', sequenceNumber: () => '0', incrementSequenceNumber: () => {} }, {
        fee: '100',
        networkPassphrase,
      })
      .addOperation(contract.call('get_question'))
      .setTimeout(300)
      .build();

      const simResult = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(simResult)) {
        if (simResult.result?.retval) {
          return scValToNative(simResult.result.retval);
        }
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  async vote(voterKey: string, option: string): Promise<string> {
    try {
      const balance = await stellar().getBalance(voterKey);
      const xlmAmount = parseFloat(balance.xlm);
      if (xlmAmount < 1.5) {
        throw new InsufficientBalanceError(
          `Insufficient XLM balance: ${xlmAmount} XLM (minimum 1.5 XLM required)`
        );
      }

      const contract = new Contract(this.contractId);
      const sourceAccount = await server.getAccount(voterKey);

      const tx = new TransactionBuilder(sourceAccount, {
        fee: '10000',
        networkPassphrase,
      })
        .addOperation(contract.call('vote', nativeToScVal(option, { type: 'string' })))
        .setTimeout(300)
        .build();

      const simResult = await server.simulateTransaction(tx);
      const preparedTx = rpc.assembleTransaction(tx, simResult).build();

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(preparedTx.toXDR(), {
        networkPassphrase,
        address: voterKey,
      });

      const sendResult = await server.sendTransaction(TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase));
      
      let txStatus = await server.getTransaction(sendResult.hash);
      while (txStatus.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        txStatus = await server.getTransaction(sendResult.hash);
      }

      return sendResult.hash;
    } catch (error: any) {
      if (error instanceof InsufficientBalanceError) {
        throw error;
      }
      if (error.message?.includes('User rejected') || error.message?.includes('closed')) {
        throw new WalletRejectedError('User rejected signing');
      }
      throw error;
    }
  }

  async getResults(): Promise<Array<{ option: string; count: number }>> {
    try {
      const contract = new Contract(this.contractId);
      const tx = new TransactionBuilder({ accountId: () => 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', sequenceNumber: () => '0', incrementSequenceNumber: () => {} }, {
        fee: '100',
        networkPassphrase,
      })
      .addOperation(contract.call('get_results'))
      .setTimeout(300)
      .build();

      const simResult = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(simResult)) {
        if (simResult.result?.retval) {
          const results = scValToNative(simResult.result.retval);
          if (Array.isArray(results)) {
             const parsed = results.map(item => ({ option: item[0], count: item[1] }));
             return parsed.sort((a,b) => b.count - a.count);
          }
        }
      }
      return [];
    } catch (error) {
      return [];
    }
  }
}

let contractClientInstance: ContractClient | null = null;

export const contractClient = (): ContractClient => {
  if (!contractClientInstance) {
    contractClientInstance = new ContractClient();
  }
  return contractClientInstance;
};
