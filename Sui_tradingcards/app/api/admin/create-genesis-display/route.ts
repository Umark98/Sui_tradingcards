import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { bcs } from '@mysten/sui/bcs';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import * as fs from 'fs';
import * as path from 'path';

// Sui network configuration
const SUI_NETWORK = getFullnodeUrl(process.env.SUI_NETWORK || 'testnet');
const client = new SuiClient({ url: SUI_NETWORK });

interface CreateDisplayRequest {
  cardType: string;
  signedTransaction?: any;
}

// Genesis card types
const GENESIS_CARD_TYPES = [
  'CommemorativeCard1',
  'CommemorativeCard2', 
  'CommemorativeCard3',
  'CommemorativeCard4'
];

export async function POST(request: NextRequest) {
  try {
    const { cardType, signedTransaction }: CreateDisplayRequest = await request.json();
    
    console.log('Received create display request for:', cardType);

    // Validate card type
    if (!GENESIS_CARD_TYPES.includes(cardType)) {
      return NextResponse.json(
        { error: `Invalid card type. Must be one of: ${GENESIS_CARD_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // If signedTransaction is provided, execute it directly
    if (signedTransaction) {
      console.log('Executing signed transaction for genesis display creation');
      console.log('Signed transaction type:', typeof signedTransaction);
      console.log('Signed transaction keys:', Object.keys(signedTransaction));
      console.log('Card type:', cardType);
      
      // Execute the signed transaction
      const result = await client.executeTransactionBlock({
        transactionBlock: signedTransaction.bytes,
        signature: signedTransaction.signature,
        options: {
          showEffects: true,
        },
      });

      // Get display object ID
      const displayId = result.effects?.created?.[0]?.reference?.objectId;

      if (!displayId) {
        throw new Error('Display object ID not found in transaction results');
      }

      // Save display ID to file
      const displayFilePath = path.join(process.cwd(), 'public', 'genesis-displays.json');
      
      // Read existing displays
      let existingDisplays = {};
      try {
        if (fs.existsSync(displayFilePath)) {
          const existingData = fs.readFileSync(displayFilePath, 'utf-8');
          existingDisplays = JSON.parse(existingData);
        }
      } catch (error) {
        console.log('No existing display file found, creating new one');
      }
      
      // Add new display
      const updatedDisplays = {
        ...existingDisplays,
        [cardType]: {
          displayId,
          cardType,
          timestamp: new Date().toISOString(),
          packageId: null, // Will be filled by frontend
          publisherId: null // Will be filled by frontend
        }
      };
      
      // Ensure public directory exists
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Write updated displays to file
      fs.writeFileSync(displayFilePath, JSON.stringify(updatedDisplays, null, 2), 'utf-8');

      console.log(`Display created successfully for ${cardType}:`, displayId);

      return NextResponse.json({
        success: true,
        displayId,
        cardType,
        message: `Display created successfully for ${cardType}`,
        transactionDigest: result.effects?.transactionDigest
      });
    }

    // Fallback to old method (for backward compatibility)
    return NextResponse.json(
      { error: 'Signed transaction is required for genesis display creation' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error creating genesis display:', error);
    return NextResponse.json(
      { error: 'Failed to create display', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
