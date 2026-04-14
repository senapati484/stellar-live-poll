import {
  Account,
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { Horizon as HorizonServer } from '@stellar/stellar-sdk';
import {
  StellarWalletsKit,
} from '@creit.tech/stellar-wallets-kit/sdk';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';

export class WalletNotFoundError extends Error {
  name = 'WalletNotFoundError';
}

export class WalletRejectedError extends Error {
  name = 'WalletRejectedError';
}

export class InsufficientBalanceError extends Error {
  name = 'InsufficientBalanceError';
}

export class DestinationUnfundedError extends Error {
  name = 'DestinationUnfundedError';
}

export class StellarHelper {
  private server: HorizonServer.Server;
  private network: 'testnet' | 'mainnet';
  private horizonUrl: string;
  private networkPassphrase: string;

  constructor(network: 'testnet' | 'mainnet') {
    this.network = network;
    this.horizonUrl =
      network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org';
    this.networkPassphrase =
      network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
    this.server = new HorizonServer.Server(this.horizonUrl);

    // Initialize StellarWalletsKit with default modules
    StellarWalletsKit.init({
      modules: defaultModules(),
    });
  }

  async connectWallet(): Promise<string> {
    try {
      const { address } = await StellarWalletsKit.getAddress();
      if (!address) {
        throw new WalletNotFoundError('No wallet extension detected');
      }
      return address;
    } catch (error: any) {
      if (error.message?.includes('User rejected') || error.message?.includes('closed')) {
        throw new WalletRejectedError('User closed modal without selecting a wallet');
      }
      if (error.message?.includes('not found') || error.message?.includes('detected')) {
        throw new WalletNotFoundError('No wallet extension detected');
      }
      throw error;
    }
  }

  disconnect(): void {
    // StellarWalletsKit doesn't have a built-in disconnect method
    // The wallet state is managed by the wallet extension
    // We can clear any local state if needed
  }

  async getBalance(publicKey: string): Promise<{ xlm: string; assets: Asset[] }> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const xlmBalance = account.balances
        .filter((balance: any) => balance.asset_type === 'native')
        .map((balance: any) => balance.balance)
        .join('');

      const xlmAmount = parseFloat(xlmBalance);
      if (xlmAmount < 1.5) {
        throw new InsufficientBalanceError(
          `Insufficient XLM balance: ${xlmAmount} XLM (minimum 1.5 XLM required for reserves)`
        );
      }

      const assets: Asset[] = account.balances
        .filter((balance: any) => balance.asset_type !== 'native')
        .map((balance: any) => {
          if (balance.asset_type === 'credit_alphanum4') {
            return new Asset(
              balance.asset_code,
              balance.asset_issuer!
            );
          } else if (balance.asset_type === 'credit_alphanum12') {
            return new Asset(
              balance.asset_code,
              balance.asset_issuer!
            );
          }
          return Asset.native();
        });

      return {
        xlm: xlmBalance,
        assets,
      };
    } catch (error: any) {
      if (error instanceof InsufficientBalanceError) {
        throw error;
      }
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  async sendPayment(params: {
    from: string;
    to: string;
    amount: string;
    memo?: string;
  }): Promise<{ hash: string; success: boolean }> {
    try {
      const { from, to, amount, memo } = params;

      // Check if destination account exists
      let destinationAccount: Account;
      let isUnfunded = false;

      try {
        destinationAccount = await this.server.loadAccount(to);
      } catch (error: any) {
        if (error.response?.status === 404) {
          isUnfunded = true;
          // Create a dummy account for unfunded destination
          destinationAccount = new Account(to, '0');
        } else {
          throw new DestinationUnfundedError('Failed to check destination account');
        }
      }

      // Load source account
      const sourceAccount = await this.server.loadAccount(from);

      // Build transaction
      let transaction: TransactionBuilder;

      if (isUnfunded) {
        // Use createAccount operation for unfunded destination
        transaction = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase: this.networkPassphrase,
        })
          .addOperation(
            Operation.createAccount({
              destination: to,
              startingBalance: amount,
            })
          );
      } else {
        // Use payment operation for funded destination
        transaction = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase: this.networkPassphrase,
        }).addOperation(
          Operation.payment({
            destination: to,
            asset: Asset.native(),
            amount: amount,
          })
        );
      }

      // Add memo if provided
      if (memo) {
        transaction.addMemo(Memo.text(memo));
      }

      const builtTransaction = transaction.setTimeout(300).build();

      // Sign transaction using static method
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(
        builtTransaction.toXDR(),
        {
          networkPassphrase: this.networkPassphrase,
          address: from,
        }
      );

      // Submit transaction
      const result = await this.server.submitTransaction(
        TransactionBuilder.fromXDR(signedTxXdr, this.networkPassphrase)
      );

      return {
        hash: result.hash,
        success: true,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new DestinationUnfundedError('Destination account not found');
      }
      throw new Error(`Failed to send payment: ${error.message}`);
    }
  }

  async getRecentTransactions(
    publicKey: string,
    limit: number = 10
  ): Promise<Horizon.ServerApi.TransactionRecord[]> {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call();

      return transactions.records;
    } catch (error: any) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  getExplorerLink(hash: string, type: 'tx' | 'account'): string {
    const baseUrl =
      this.network === 'testnet'
        ? 'https://stellar.expert/testnet'
        : 'https://stellar.expert';
    return type === 'tx' ? `${baseUrl}/tx/${hash}` : `${baseUrl}/account/${hash}`;
  }

  formatAddress(address: string, start: number = 4, end: number = 4): string {
    if (!address || address.length <= start + end) {
      return address;
    }
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }
}

let stellarInstance: StellarHelper | null = null;

export const stellar = (): StellarHelper => {
  if (!stellarInstance) {
    stellarInstance = new StellarHelper('testnet');
  }
  return stellarInstance;
};
