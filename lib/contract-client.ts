import { stellar } from './stellar-helper';
import {
  WalletRejectedError,
  InsufficientBalanceError,
} from './stellar-helper';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID;

if (!CONTRACT_ID) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ID is not set');
}

const rpcUrl = 'https://soroban-testnet.stellar.org';

export class ContractClient {
  private contractId: string;

  constructor() {
    this.contractId = CONTRACT_ID!;
  }

  async setQuestion(adminKey: string, question: string): Promise<string> {
    try {
      // For now, return a mock transaction hash
      // This will need proper implementation after contract deployment
      const txHash = 'mock-tx-hash-' + Date.now();
      return txHash;
    } catch (error: any) {
      if (error.message?.includes('User rejected') || error.message?.includes('closed')) {
        throw new WalletRejectedError('User rejected signing');
      }
      throw error;
    }
  }

  async getQuestion(): Promise<string> {
    try {
      // For now, return a mock question
      // This will need proper implementation after contract deployment
      return '';
    } catch (error) {
      return '';
    }
  }

  async vote(voterKey: string, option: string): Promise<string> {
    try {
      const balance = await stellar.getBalance(voterKey);
      const xlmAmount = parseFloat(balance.xlm);
      if (xlmAmount < 1.5) {
        throw new InsufficientBalanceError(
          `Insufficient XLM balance: ${xlmAmount} XLM (minimum 1.5 XLM required)`
        );
      }

      // For now, return a mock transaction hash
      // This will need proper implementation after contract deployment
      const txHash = 'mock-vote-tx-hash-' + Date.now();
      return txHash;
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
      // For now, return empty results
      // This will need proper implementation after contract deployment
      return [];
    } catch (error) {
      return [];
    }
  }
}

export const contractClient = new ContractClient();
