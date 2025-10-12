import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Sui network configuration
const SUI_NETWORK = getFullnodeUrl(process.env.SUI_NETWORK || 'testnet');
const client = new SuiClient({ url: SUI_NETWORK });

interface MintGenesisCardRequest {
  cardType: string;
  mintNumber: number;
  recipient: string;
  transactionBytes: string; // Base64 encoded transaction bytes from frontend
  signature: string; // Transaction signature from frontend
}

export async function POST(request: NextRequest) {
  try {
    const mintingData: MintGenesisCardRequest = await request.json();
    
    console.log('Received genesis card minting request:', {
      cardType: mintingData.cardType,
      mintNumber: mintingData.mintNumber,
      recipient: mintingData.recipient,
      hasTransactionBytes: !!mintingData.transactionBytes,
      hasSignature: !!mintingData.signature
    });

    // Validate required fields
    if (!mintingData.cardType || !mintingData.mintNumber || !mintingData.recipient || 
        !mintingData.transactionBytes || !mintingData.signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate card type
    const validCardTypes = ['CommemorativeCard1', 'CommemorativeCard2', 'CommemorativeCard3', 'CommemorativeCard4'];
    if (!validCardTypes.includes(mintingData.cardType)) {
      return NextResponse.json(
        { error: `Invalid card type. Must be one of: ${validCardTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Execute the transaction that was built and signed on the frontend
    const transactionBytes = Buffer.from(mintingData.transactionBytes, 'base64');
    
    const txResponse = await client.executeTransactionBlock({
      transactionBlock: transactionBytes,
      signature: mintingData.signature,
      requestType: "WaitForLocalExecution",
      options: {
        showEvents: true,
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
        showInput: true,
      },
    });

    // Check if the transaction was successful
    if (txResponse?.effects?.status?.status === "success") {
      const createdObjects = txResponse.effects.created || [];
      
      // Find the minted card object ID from the created objects
      // The minted card should be the first created object
      const mintedCardObject = createdObjects?.[0];
      
      console.log('Genesis card minted successfully:', {
        transactionDigest: txResponse.effects.transactionDigest,
        createdObjects: createdObjects.length,
        mintedCardObjectId: mintedCardObject?.reference?.objectId
      });
      
      return NextResponse.json({
        success: true,
        transactionDigest: txResponse.effects.transactionDigest,
        message: `Genesis ${mintingData.cardType} minted successfully!`,
        cardType: mintingData.cardType,
        mintNumber: mintingData.mintNumber,
        recipient: mintingData.recipient,
        mintedCardObjectId: mintedCardObject?.reference?.objectId,
        createdObjects: createdObjects,
        effects: txResponse.effects,
        events: txResponse.events
      });
    } else {
      throw new Error(`Transaction failed: ${txResponse?.effects?.status?.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Error minting genesis card:', error);
    return NextResponse.json(
      { error: 'Failed to mint genesis card', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
