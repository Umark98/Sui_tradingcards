import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

interface EditMetadataRequest {
  cardType: string;
  metadataObjectId: string;
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
  transactionBytes: string;
  signature: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EditMetadataRequest = await request.json();
    
    console.log('Edit metadata request received:', {
      cardType: body.cardType,
      metadataObjectId: body.metadataObjectId,
      version: body.version,
      description: body.description
    });

    // Validate required fields
    if (!body.cardType || !body.metadataObjectId || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: cardType, metadataObjectId, description' },
        { status: 400 }
      );
    }

    // Load environment variables
    const PACKAGE_ID = process.env.PACKAGE_ID;
    const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID;
    const SUI_NETWORK = process.env.SUI_NETWORK || 'testnet';

    if (!PACKAGE_ID || !ADMIN_CAP_ID) {
      return NextResponse.json(
        { error: 'PACKAGE_ID or ADMIN_CAP_ID not configured' },
        { status: 500 }
      );
    }

    // Setup Sui client
    const client = new SuiClient({
      url: getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet'),
    });

    // Handle transaction execution
    let result;
    
    if (body.transactionBytes && body.signature) {
      // Create transaction from bytes if provided
      try {
        console.log('Transaction bytes received:', body.transactionBytes);
        console.log('Signature received:', body.signature);
        
        // Try to deserialize the transaction
        const tx = Transaction.from(body.transactionBytes as string);
        console.log('Transaction deserialized successfully');
        
        result = await client.executeTransactionBlock({
          transactionBlock: tx as any,
          signature: body.signature,
          options: {
            showEffects: true,
            showObjectChanges: true,
            showEvents: true,
          },
        });
      } catch (txError) {
        console.error('Transaction deserialization error:', txError);
        console.error('Transaction bytes that failed:', body.transactionBytes);
        
        // Try alternative approach - execute raw transaction bytes
        try {
          console.log('Trying alternative execution method...');
          result = await client.executeTransactionBlock({
            transactionBlock: body.transactionBytes,
            signature: body.signature,
            options: {
              showEffects: true,
              showObjectChanges: true,
              showEvents: true,
            },
          });
          console.log('Alternative execution successful');
        } catch (altError) {
          console.error('Alternative execution also failed:', altError);
          return NextResponse.json(
            { 
              error: 'Invalid transaction format', 
              details: txError instanceof Error ? txError.message : 'Unknown transaction error',
              alternativeError: altError instanceof Error ? altError.message : 'Unknown alternative error',
              transactionBytes: body.transactionBytes
            },
            { status: 400 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Missing transaction data' },
        { status: 400 }
      );
    }

    console.log('Edit metadata transaction executed:', {
      digest: result.digest,
      status: result.effects?.status?.status
    });

    // Check if transaction was successful
    if (result.effects?.status?.status !== 'success') {
      return NextResponse.json(
        { 
          error: 'Transaction failed', 
          details: result.effects?.status?.error 
        },
        { status: 400 }
      );
    }

    // Update the frontend metadata file
    try {
      const fs = require('fs');
      const path = require('path');
      
      const metadataFilePath = path.join(process.cwd(), 'public', 'Gadget-minted-metadata.json');
      
      // Read existing metadata
      let existingMetadata: Record<string, any> = {};
      if (fs.existsSync(metadataFilePath)) {
        const fileContent = fs.readFileSync(metadataFilePath, 'utf8');
        existingMetadata = JSON.parse(fileContent);
      }

      // Update the metadata entry - COMPLETELY REPLACE to avoid accumulating old data
      if (existingMetadata[body.cardType]) {
        // Get the original objectId and objectType from existing metadata
        const originalObjectId = existingMetadata[body.cardType].objectId;
        const originalObjectType = existingMetadata[body.cardType].objectType;
        const originalTimestamp = existingMetadata[body.cardType].timestamp;
        
        // COMPLETELY REPLACE the metadata entry with new data
        existingMetadata[body.cardType] = {
          objectId: originalObjectId,
          objectType: originalObjectType,
          timestamp: originalTimestamp,
          version: body.version,
          game: body.game,
          description: body.description,
          episodeUtility: body.episodeUtility,
          transferability: body.transferability,
          royalty: body.royalty,
          unlockCurrency: body.unlockCurrency,
          edition: body.edition,
          set: body.set,
          upgradeable: body.upgradeable,
          subType: body.subType,
          season: body.season,
          // Use the first level's primary image as the main image
          imageUrl: body.mediaUrlsPrimaryValues[0] || body.mediaUrlsDisplayValues[0] || '',
          levels: body.keys.map((key, index) => ({
            key,
            rarity: body.rarityValues[index],
            enhancement: body.enhancementValues[index],
            unlockThreshold: body.unlockThresholdValues[index],
            mediaUrlPrimary: body.mediaUrlsPrimaryValues[index],
            mediaUrlDisplay: body.mediaUrlsDisplayValues[index],
            rank: body.rankValues[index]
          })),
          // Update level images for easy access - ONLY current levels
          levelImages: body.keys.reduce((acc, key, index) => {
            acc[key.toString()] = body.mediaUrlsPrimaryValues[index] || body.mediaUrlsDisplayValues[index];
            return acc;
          }, {} as Record<string, string>),
          lastUpdated: new Date().toISOString()
        };

        // Write updated metadata back to file
        fs.writeFileSync(metadataFilePath, JSON.stringify(existingMetadata, null, 2));
        
        console.log(`Updated metadata for card type: ${body.cardType}`);
      }
    } catch (fileError) {
      console.error('Error updating metadata file:', fileError);
      // Don't fail the request if file update fails
    }

    return NextResponse.json({
      success: true,
      digest: result.digest,
      effects: result.effects,
      objectChanges: result.objectChanges,
      events: result.events
    });

  } catch (error) {
    console.error('Error in edit metadata API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
