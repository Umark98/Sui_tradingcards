import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { cardType, signedTransaction } = await request.json();

    if (!cardType || !signedTransaction) {
      return NextResponse.json(
        { error: 'Card type and signed transaction are required' },
        { status: 400 }
      );
    }

    // Initialize Sui client
    const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
    const client = new SuiClient({ url: getFullnodeUrl(network) });

    console.log('Executing transaction for mission display:', cardType);

    // Execute the signed transaction
    const result = await client.executeTransactionBlock({
      transactionBlock: signedTransaction.transactionBlockBytes,
      signature: signedTransaction.signature,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('Transaction result:', result);

    // Check transaction status
    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
    }

    // Extract the display object ID from created or mutated objects
    const createdObjects = result.effects?.created || [];
    const mutatedObjects = result.effects?.mutated || [];
    console.log('Created objects:', createdObjects);
    console.log('Mutated objects:', mutatedObjects);
    
    // Check if this is an update (mutated) or create (created)
    let displayObject;
    let isUpdate = false;
    
    // First, try to find in created objects (for new displays)
    displayObject = createdObjects.find((obj: any) => 
      obj.owner && typeof obj.owner === 'object' && 'AddressOwner' in obj.owner
    );

    // If not found in created, look in mutated objects (for updates)
    if (!displayObject) {
      displayObject = mutatedObjects.find((obj: any) => 
        obj.owner && typeof obj.owner === 'object' && 'AddressOwner' in obj.owner
      );
      isUpdate = true;
    }

    if (!displayObject) {
      console.error('Display object not found. Created:', createdObjects, 'Mutated:', mutatedObjects);
      throw new Error('Display object not found in transaction results');
    }

    const displayId = displayObject.reference.objectId;
    console.log('Display ID extracted:', displayId, isUpdate ? '(updated)' : '(created)');

    // Fetch the display object to get the image URL
    let imageUrl = '';
    try {
      console.log('Fetching display object data for image URL...');
      
      // Wait a bit for the display to be indexed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const displayObjectData = await client.getObject({
        id: displayId,
        options: {
          showContent: true,
          showDisplay: true,
        },
      });

      console.log('=== FULL DISPLAY OBJECT DATA ===');
      console.log(JSON.stringify(displayObjectData, null, 2));
      console.log('=== END DISPLAY OBJECT DATA ===');

      // Recursive function to find image URL anywhere in the object
      const findImageUrl = (obj: any, depth = 0, path = ''): string => {
        if (depth > 15) return ''; // Prevent infinite recursion
        if (!obj || typeof obj !== 'object') return '';

        // Direct checks for image URL
        if (typeof obj.image_url === 'string' && obj.image_url.startsWith('http')) {
          console.log(`✅ Found image_url at path: ${path}.image_url`);
          return obj.image_url;
        }
        if (typeof obj.imageUrl === 'string' && obj.imageUrl.startsWith('http')) {
          console.log(`✅ Found imageUrl at path: ${path}.imageUrl`);
          return obj.imageUrl;
        }
        if (typeof obj.image === 'string' && obj.image.startsWith('http')) {
          console.log(`✅ Found image at path: ${path}.image`);
          return obj.image;
        }
        if (typeof obj.value === 'string' && obj.value.startsWith('http')) {
          console.log(`✅ Found value at path: ${path}.value`);
          return obj.value;
        }

        // Check if it's a key-value pair object
        if (obj.key === 'image_url' && typeof obj.value === 'string') {
          console.log(`✅ Found key-value pair at path: ${path}`);
          return obj.value;
        }

        // Check nested fields object
        if (obj.fields) {
          if (obj.fields.key === 'image_url' && typeof obj.fields.value === 'string') {
            console.log(`✅ Found in fields.key-value at path: ${path}.fields`);
            return obj.fields.value;
          }
          const result = findImageUrl(obj.fields, depth + 1, `${path}.fields`);
          if (result) return result;
        }

        // Recursively search arrays
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const result = findImageUrl(obj[i], depth + 1, `${path}[${i}]`);
            if (result) return result;
          }
        }

        // Recursively search object properties
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && key !== 'objectId' && key !== 'digest') {
            const result = findImageUrl(obj[key], depth + 1, `${path}.${key}`);
            if (result) return result;
          }
        }

        return '';
      };

      // Try to find image URL anywhere in the display object
      imageUrl = findImageUrl(displayObjectData, 0, 'root');

      if (imageUrl) {
        console.log('✅ Successfully extracted image URL:', imageUrl);
      } else {
        console.log('⚠️ Could not find image URL in display object');
        console.log('Please check the full display object data above and report the structure');
      }
    } catch (error) {
      console.error('❌ Error fetching display object data:', error);
      // Continue without image URL if fetch fails
    }

    // Save the display ID to the mission-displays.json file
    const displayFilePath = path.join(process.cwd(), 'public', 'mission-displays.json');
    
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
        digest: result.digest,
        imageUrl: imageUrl || existingDisplays[cardType]?.imageUrl || ''
      }
    };
    
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write updated displays to file
    fs.writeFileSync(displayFilePath, JSON.stringify(updatedDisplays, null, 2), 'utf-8');

    console.log(`Mission display ${isUpdate ? 'updated' : 'created'} and saved for ${cardType}:`, displayId);

    return NextResponse.json({
      success: true,
      displayId,
      cardType,
      digest: result.digest,
      isUpdate,
      message: `Mission display ${isUpdate ? 'updated' : 'created'} successfully for ${cardType}`
    });

  } catch (error) {
    console.error('Error creating mission display:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create mission display', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

