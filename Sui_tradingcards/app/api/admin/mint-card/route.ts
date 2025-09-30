import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getCurrentContractAddresses } from '@/lib/contract-addresses';

// Sui network configuration
const SUI_NETWORK = getFullnodeUrl('testnet');
const client = new SuiClient({ url: SUI_NETWORK });

// Contract addresses - loaded from .env.local (updated after contract publishing)
// Environment variables take priority as they are the most current
const PACKAGE_ID = process.env.PACKAGE_ID || '';
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID || '';

interface MintCardRequest {
  cardType: string;
  metadataObjectId: string;
  title: string;
  level: number;
  metadataId: string;
  mintedNumber: number;
  recipient: string;
  transactionBytes: string; // Base64 encoded transaction bytes from frontend
  signature: string; // Transaction signature from frontend
}

export async function POST(request: NextRequest) {
  try {
    const mintingData: MintCardRequest = await request.json();
    
    console.log('Received mint card request data:', mintingData);
    console.log('Card type:', mintingData.cardType);
    console.log('Metadata object ID:', mintingData.metadataObjectId);
    console.log('Title:', mintingData.title);
    console.log('Level:', mintingData.level);
    console.log('Metadata ID:', mintingData.metadataId);
    console.log('Minted number:', mintingData.mintedNumber);
    console.log('Recipient:', mintingData.recipient);
    console.log('Transaction bytes present:', !!mintingData.transactionBytes);
    console.log('Signature present:', !!mintingData.signature);

    // Validate required fields
    if (!mintingData.cardType || !mintingData.metadataObjectId || !mintingData.title || 
        !mintingData.level || !mintingData.metadataId || !mintingData.mintedNumber || 
        !mintingData.recipient || !mintingData.transactionBytes || !mintingData.signature) {
      console.log('Missing required fields validation failed');
      console.log('Missing fields:', {
        cardType: !mintingData.cardType,
        metadataObjectId: !mintingData.metadataObjectId,
        title: !mintingData.title,
        level: !mintingData.level,
        metadataId: !mintingData.metadataId,
        mintedNumber: !mintingData.mintedNumber,
        recipient: !mintingData.recipient,
        transactionBytes: !mintingData.transactionBytes,
        signature: !mintingData.signature
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      
      return NextResponse.json({
        success: true,
        transactionDigest: txResponse.effects.transactionDigest,
        message: 'Card minted and transferred successfully!',
        cardType: mintingData.cardType,
        recipient: mintingData.recipient,
        title: mintingData.title,
        level: mintingData.level,
        mintedNumber: mintingData.mintedNumber,
        createdObjects: createdObjects,
        effects: txResponse.effects,
        events: txResponse.events
      });
    } else {
      throw new Error(`Transaction failed: ${txResponse?.effects?.status?.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Error creating minting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create minting transaction' },
      { status: 500 }
    );
  }
}