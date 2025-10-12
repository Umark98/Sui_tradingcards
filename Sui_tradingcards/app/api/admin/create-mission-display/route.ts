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
      transactionBlock: signedTransaction.bytes || signedTransaction.transactionBlockBytes,
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
    
    // Add new display
    const updatedDisplays = {
      ...existingDisplays,
      [cardType]: {
        displayId,
        cardType,
        timestamp: new Date().toISOString(),
        digest: result.digest
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

