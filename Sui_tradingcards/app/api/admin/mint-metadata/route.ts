import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import * as fs from 'fs';
import * as path from 'path';
import { getCurrentContractAddresses, generateObjectType } from '@/lib/contract-addresses';

// Sui network configuration
const SUI_NETWORK = getFullnodeUrl(process.env.SUI_NETWORK || 'testnet');
const client = new SuiClient({ url: SUI_NETWORK });

// Contract addresses - loaded from .env.local (updated after contract publishing)
// Environment variables take priority as they are the most current
const PACKAGE_ID = process.env.PACKAGE_ID || '';
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID || '';

interface MintMetadataRequest {
  cardType: string;
  version: number;
  keys: number[];
  game?: string;
  description: string;
  rarityValues: string[];
  enhancementValues: string[];
  episodeUtility?: number;
  transferability: string;
  royalty: number;
  unlockCurrency?: string;
  unlockThresholdValues: number[];
  edition?: string;
  set?: string;
  upgradeable: boolean;
  mediaUrlsPrimaryValues: string[];
  mediaUrlsDisplayValues: string[];
  rankValues: number[];
  subType: string;
  season?: number;
  transactionBytes: string; // Base64 encoded transaction bytes from frontend
  signature: string; // Transaction signature from frontend
}

export async function POST(request: NextRequest) {
  try {
    const metadataData: MintMetadataRequest = await request.json();
    
    console.log('Received request data:', metadataData);
    console.log('Transaction bytes present:', !!metadataData.transactionBytes);
    console.log('Signature present:', !!metadataData.signature);
    console.log('Transaction bytes value:', metadataData.transactionBytes);
    console.log('Signature value:', metadataData.signature);

    // Validate required fields
    if (!metadataData.cardType || !metadataData.description || !metadataData.keys.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate required transaction bytes and signature
    if (!metadataData.transactionBytes || !metadataData.signature) {
      console.log('Missing transaction bytes or signature');
      console.log('Transaction bytes:', metadataData.transactionBytes);
      console.log('Signature:', metadataData.signature);
      return NextResponse.json(
        { error: 'Transaction bytes and signature are required' },
        { status: 400 }
      );
    }

    // Execute the transaction that was built and signed on the frontend
    const transactionBytes = Buffer.from(metadataData.transactionBytes, 'base64');
    
    const txResponse = await client.executeTransactionBlock({
      transactionBlock: transactionBytes,
      signature: metadataData.signature,
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
      
      // Find the metadata object ID from the created objects
      // Since objectType might not be available, we'll use the first created object
      // as it should be the metadata object from the mint_metadata function
      const metadataObject = createdObjects?.[0];
      
      console.log('Created objects:', createdObjects);
      console.log('Found metadata object:', metadataObject);
      
      // Save metadata ID to JSON file
      if (metadataObject && metadataObject.reference?.objectId) {
        const metadataFilePath = path.join(process.cwd(), 'public', 'frontend-metadata-ids.json');
        
        // Read existing metadata IDs
        let existingMetadata = {};
        try {
          if (fs.existsSync(metadataFilePath)) {
            const existingData = fs.readFileSync(metadataFilePath, 'utf-8');
            existingMetadata = JSON.parse(existingData);
          }
        } catch (error) {
          console.log('No existing metadata file found, creating new one');
        }
        
        // Add new metadata ID
        const updatedMetadata = {
          ...existingMetadata,
          [metadataData.cardType]: {
            objectId: metadataObject.reference.objectId,
            objectType: (metadataObject as any).objectType || generateObjectType(metadataData.cardType),
            timestamp: new Date().toISOString(),
            version: metadataData.version,
            description: metadataData.description,
            imageUrl: metadataData.mediaUrlsPrimaryValues?.[0] || metadataData.mediaUrlsDisplayValues?.[0] || ''
          }
        };
        
        // Ensure the public directory exists
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Write updated metadata to file
        fs.writeFileSync(metadataFilePath, JSON.stringify(updatedMetadata, null, 2), 'utf-8');
        
        console.log(`Metadata ID saved for ${metadataData.cardType}: ${metadataObject.reference.objectId}`);
        console.log('Updated metadata data:', updatedMetadata);
        console.log('File written to:', metadataFilePath);
      } else {
        console.log('No metadata object found in created objects');
        console.log('Available object types:', createdObjects?.map((obj: any) => obj.objectType));
      }
      
      return NextResponse.json({
        success: true,
        transactionDigest: txResponse.effects.transactionDigest,
        message: 'Metadata minted successfully!',
        cardType: metadataData.cardType,
        metadataObjectId: metadataObject?.reference.objectId,
        createdObjects: createdObjects,
        effects: txResponse.effects,
        events: txResponse.events
      });
    } else {
      throw new Error(`Transaction failed: ${txResponse?.effects?.status?.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Error creating mint metadata transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create mint metadata transaction' },
      { status: 500 }
    );
  }
}
