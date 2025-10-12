import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export interface TransactionResult {
  success: boolean;
  objectId?: string;
  error?: string;
  transactionResponse?: any;
}

export class TransactionHandler {
  private client: SuiClient;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') });
  }

  async executeTransaction(
    transaction: Transaction,
    currentAccount: any,
    currentWallet: any,
    apiEndpoint: string,
    requestBody: any
  ): Promise<TransactionResult> {
    try {
      // Set sender address
      transaction.setSender(currentAccount.address);
      
      // Set gas budget
      transaction.setGasBudget(10000000);

      // Check if the wallet supports signTransaction feature
      if (!currentWallet.features['sui:signTransaction']) {
        throw new Error('signTransaction feature is not supported by the current wallet');
      }
      
      const signTransaction = currentWallet.features['sui:signTransaction'].signTransaction;
      const signedTransaction = await signTransaction({
        transaction: transaction,
        account: currentAccount,
      });

      console.log('Transaction signed successfully');

      // Execute the signed transaction via backend
      const executeResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...requestBody,
          transactionBytes: signedTransaction.transaction || signedTransaction.transactionBytes || signedTransaction.bytes || transaction.serialize(),
          signature: signedTransaction.signature
        })
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to execute transaction: ${errorData.error || 'Unknown error'}`);
      }

      const txResponse = await executeResponse.json();

      // Check if the transaction was successful
      if (txResponse?.effects?.status?.status === "success") {
        const objectId = this.extractObjectId(txResponse, requestBody.cardType);
        return {
          success: true,
          objectId,
          transactionResponse: txResponse
        };
      } else {
        throw new Error(`Transaction failed: ${txResponse?.effects?.status?.error || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('Transaction error details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute transaction';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private extractObjectId(txResponse: any, cardType?: string): string | undefined {
    const createdObjects = txResponse.effects.created || [];
    
    // Debug: Log the transaction response structure
    console.log('Transaction response:', txResponse);
    console.log('Created objects:', createdObjects);
    console.log('Created objects count:', createdObjects?.length);
    
    // Find the minted card object from the created objects
    // Try multiple ways to find the TradingCard object
    let mintedCard = createdObjects?.find(
      (item: any) => item.objectType?.includes('TradingCard')
    );
    
    // If not found with TradingCard, try looking for any object with the card type
    if (!mintedCard && cardType) {
      mintedCard = createdObjects?.find(
        (item: any) => item.objectType?.includes(cardType)
      );
    }
    
    // If still not found, try the first created object (often the minted card)
    if (!mintedCard && createdObjects?.length > 0) {
      mintedCard = createdObjects[0];
    }

    // Extract the object ID of the minted card with multiple fallbacks
    return mintedCard?.reference?.objectId || 
           mintedCard?.objectId || 
           mintedCard?.reference?.objectId ||
           mintedCard?.data?.objectId;
  }

  generateTypeArgument(packageId: string, cardType: string): string {
    return `${packageId}::gadget_gameplay_items::TradingCard<${packageId}::gadget_gameplay_items_titles::${cardType}>`;
  }
}

export const transactionHandler = new TransactionHandler();
