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
        transactionBlock: signedTransaction.transactionBlockBytes,
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

      console.log('Display ID extracted:', displayId);

      // Fetch the display object to get the image URL
      let imageUrl = '';
      try {
        console.log('Fetching display object data for image URL...');
        const displayObjectData = await client.getObject({
          id: displayId,
          options: {
            showContent: true,
            showDisplay: true,
          },
        });

      console.log('Display object data:', JSON.stringify(displayObjectData, null, 2));

      // Recursive function to find image URL anywhere in the object
      const findImageUrl = (obj: any, depth = 0): string => {
        if (depth > 10) return ''; // Prevent infinite recursion
        if (!obj || typeof obj !== 'object') return '';

        // Direct checks for image URL
        if (typeof obj.image_url === 'string' && obj.image_url.startsWith('http')) {
          console.log('Found image_url at depth', depth, ':', obj.image_url);
          return obj.image_url;
        }
        if (typeof obj.imageUrl === 'string' && obj.imageUrl.startsWith('http')) {
          console.log('Found imageUrl at depth', depth, ':', obj.imageUrl);
          return obj.imageUrl;
        }
        if (typeof obj.image === 'string' && obj.image.startsWith('http')) {
          console.log('Found image at depth', depth, ':', obj.image);
          return obj.image;
        }
        if (typeof obj.value === 'string' && obj.value.startsWith('http')) {
          console.log('Found value at depth', depth, ':', obj.value);
          return obj.value;
        }

        // Check if it's a key-value pair object
        if (obj.key === 'image_url' && typeof obj.value === 'string') {
          console.log('Found key-value pair at depth', depth, ':', obj.value);
          return obj.value;
        }

        // Check nested fields object
        if (obj.fields) {
          if (obj.fields.key === 'image_url' && typeof obj.fields.value === 'string') {
            console.log('Found in fields.key-value at depth', depth, ':', obj.fields.value);
            return obj.fields.value;
          }
          const result = findImageUrl(obj.fields, depth + 1);
          if (result) return result;
        }

        // Recursively search arrays
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const result = findImageUrl(item, depth + 1);
            if (result) return result;
          }
        }

        // Recursively search object properties
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const result = findImageUrl(obj[key], depth + 1);
            if (result) return result;
          }
        }

        return '';
      };

      // Try to find image URL anywhere in the display object
      imageUrl = findImageUrl(displayObjectData);

      console.log('Extracted image URL:', imageUrl);
      } catch (error) {
        console.error('Error fetching display object data:', error);
        // Continue without image URL if fetch fails
      }

      // Save display ID to file
      const displayFilePath = path.join(process.cwd(), 'public', 'genesis-displays.json');
      
      // Read existing displays
      let existingDisplays: any = {};
      try {
        if (fs.existsSync(displayFilePath)) {
          const existingData = fs.readFileSync(displayFilePath, 'utf-8');
          existingDisplays = JSON.parse(existingData);
        }
      } catch (error) {
        console.log('No existing display file found, creating new one');
      }
      
      // Add new display with image URL
      const updatedDisplays = {
        ...existingDisplays,
        [cardType]: {
          displayId,
          cardType,
          timestamp: new Date().toISOString(),
          imageUrl: imageUrl || existingDisplays[cardType]?.imageUrl || '',
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
