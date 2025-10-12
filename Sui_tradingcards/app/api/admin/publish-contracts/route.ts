import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { updatePackageIdInString } from '@/lib/contract-addresses';
import { getDeploymentConfig, validateDeploymentConfig } from '@/lib/config';

// Sui network configuration
const SUI_NETWORK = getFullnodeUrl(process.env.SUI_NETWORK || 'testnet');
const client = new SuiClient({ url: SUI_NETWORK });

// Get deployment configuration
const config = getDeploymentConfig();
const validation = validateDeploymentConfig(config);

if (!validation.valid) {
  console.warn('Deployment configuration issues:', validation.errors);
}

interface PublishContractsRequest {
  transactionBytes: string; // Base64 encoded transaction bytes from frontend
  signature: string; // Transaction signature from frontend
}

export async function POST(request: NextRequest) {
  try {
    const { transactionBytes, signature }: PublishContractsRequest = await request.json();

    console.log('Received request with transactionBytes length:', transactionBytes?.length);
    console.log('Received request with signature:', signature?.substring(0, 20) + '...');
    console.log('Transaction bytes type:', typeof transactionBytes);
    console.log('Signature type:', typeof signature);

    if (!transactionBytes || !signature) {
      console.error('Missing required fields:', { hasTransactionBytes: !!transactionBytes, hasSignature: !!signature });
      return NextResponse.json(
        { error: 'Transaction bytes and signature are required' },
        { status: 400 }
      );
    }

    // Execute the transaction that was built and signed on the frontend
    let txBytes;
    try {
      // Handle different input formats
      if (typeof transactionBytes === 'string') {
        // Try to decode as base64
        txBytes = Buffer.from(transactionBytes, 'base64');
        console.log('Decoded transaction bytes from base64, length:', txBytes.length);
      } else if (Buffer.isBuffer(transactionBytes)) {
        txBytes = transactionBytes;
        console.log('Using transaction bytes as Buffer, length:', txBytes.length);
      } else if (transactionBytes instanceof Uint8Array) {
        txBytes = Buffer.from(transactionBytes);
        console.log('Converted Uint8Array to Buffer, length:', txBytes.length);
      } else {
        throw new Error(`Unsupported transaction bytes format: ${typeof transactionBytes}`);
      }
      
      // Validate the transaction bytes
      if (txBytes.length === 0) {
        throw new Error('Transaction bytes are empty');
      }
      
      console.log('Final transaction bytes length:', txBytes.length);
      console.log('First 20 bytes (hex):', txBytes.slice(0, 20).toString('hex'));
      
    } catch (decodeError) {
      console.error('Error processing transaction bytes:', decodeError);
      return NextResponse.json(
        { error: `Failed to process transaction bytes: ${decodeError.message}` },
        { status: 400 }
      );
    }
    
    console.log('Executing transaction block...');
    const txResponse = await client.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: signature,
      requestType: "WaitForLocalExecution",
      options: {
        showEvents: true,
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
        showInput: true,
      },
    });
    
    console.log('Transaction executed successfully:', txResponse.effects?.status?.status);

    // Check if the transaction was successful
    if (txResponse?.effects?.status?.status === "success") {
      const createdObjects = txResponse.effects.created || [];
      const objectChanges = txResponse.objectChanges || [];
      
      console.log('All created objects:', JSON.stringify(createdObjects, null, 2));
      console.log('Object changes:', JSON.stringify(objectChanges, null, 2));
      
      // Extract object types from objectChanges instead of created objects
      const createdObjectChanges = objectChanges.filter(change => change.type === 'created');
      console.log('Created object changes:', JSON.stringify(createdObjectChanges, null, 2));
      
      // Find the package ID from the created objects
      const packageID = createdObjects?.find(
        (item) => item.owner === "Immutable"
      )?.reference.objectId;
      
      // Validate that we have the required data
      if (!packageID) {
        throw new Error('Package ID not found in transaction results');
      }

      // Find the admin cap object ID from objectChanges
      const adminCapObject = createdObjectChanges?.find(
        (item) => item.objectType?.includes('AdminCap') || item.objectType?.includes('cap::AdminCap')
      );
      
      if (!adminCapObject) {
        console.warn('Admin Cap object not found in transaction results');
        console.log('Available object types:', createdObjectChanges?.map(obj => obj.objectType));
      }

      // Find the upgrade cap object ID from objectChanges
      const upgradeCapObject = createdObjectChanges?.find(
        (item) => item.objectType?.includes('UpgradeCap') || item.objectType?.includes('package::UpgradeCap')
      );

      // Find the publisher object ID from objectChanges
      const publisherObject = createdObjectChanges?.find(
        (item) => item.objectType?.includes('Publisher') || item.objectType?.includes('package::Publisher')
      );

      // Find display objects from objectChanges
      const displayObjects = createdObjectChanges?.filter(
        (item) => item.objectType?.includes('Display')
      ) || [];

      console.log('Package ID:', packageID);
      console.log('Admin Cap Object:', adminCapObject);
      console.log('Upgrade Cap Object:', upgradeCapObject);
      console.log('Publisher Object:', publisherObject);
      console.log('Display Objects:', displayObjects);

      // Extract all unique object types for mint metadata interface from objectChanges
      const allObjectTypes = [...new Set(createdObjectChanges.map(obj => obj.objectType).filter(Boolean))];
      
      // Prepare comprehensive transaction data
      const transactionData = {
        packageId: packageID,
        transactionDigest: txResponse.effects.transactionDigest,
        adminCapObjectId: adminCapObject?.objectId,
        upgradeCapObjectId: upgradeCapObject?.objectId,
        publisherObjectId: publisherObject?.objectId,
        displayObjects: displayObjects.map(obj => ({
          objectId: obj.objectId,
          objectType: obj.objectType,
          type: obj.type
        })),
        allCreatedObjects: createdObjectChanges.map(obj => ({
          objectId: obj.objectId,
          objectType: obj.objectType,
          type: obj.type
        })),
        allObjectTypes: allObjectTypes, // For mint metadata interface
        network: process.env.SUI_NETWORK || 'testnet',
        timestamp: new Date().toISOString(),
        effects: txResponse.effects,
        events: txResponse.events
      };

      // Clear old data and save to JSON file in the setup directory
      const outputPath = config.publishedContractsPath;
      
      // Clear any existing data by writing fresh data
      const freshTransactionData = {
        ...transactionData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      fs.writeFileSync(outputPath, JSON.stringify(freshTransactionData, null, 2), 'utf-8');

      // Save object types and IDs specifically for mint metadata interface
      const objectTypesPath = config.contractObjectsPath;
      
      // Ensure the public directory exists
      if (!fs.existsSync(config.publicDir)) {
        fs.mkdirSync(config.publicDir, { recursive: true });
      }
      
      // Clear old data and save fresh object types data
      const freshObjectTypesData = {
        packageId: packageID,
        adminCapId: adminCapObject?.objectId,
        upgradeCapId: upgradeCapObject?.objectId,
        publisherId: publisherObject?.objectId,
        allObjectTypes: allObjectTypes,
        allObjects: createdObjectChanges.map(obj => ({
          objectId: obj.objectId,
          objectType: obj.objectType,
          type: obj.type
        })),
        displayObjects: displayObjects.map(obj => ({
          objectId: obj.objectId,
          objectType: obj.objectType,
          type: obj.type
        })),
        timestamp: new Date().toISOString(),
        network: process.env.SUI_NETWORK || 'testnet',
        version: '1.0'
      };
      
      // Clear metadata JSON files when new contracts are published
      // These should start empty and only populate when mint-metadata is called
      const metadataIdsPath = path.join(config.publicDir, 'metadata-ids.json');
      const frontendMetadataIdsPath = path.join(config.publicDir, 'frontend-metadata-ids.json');
      const genesisDisplaysPath = path.join(config.publicDir, 'genesis-displays.json');
      
      console.log('Clearing metadata and genesis JSON files for fresh deployment...');
      
      // Write empty objects to metadata files
      fs.writeFileSync(metadataIdsPath, JSON.stringify({}, null, 2), 'utf-8');
      console.log('✅ Cleared metadata-ids.json');
      
      fs.writeFileSync(frontendMetadataIdsPath, JSON.stringify({}, null, 2), 'utf-8');
      console.log('✅ Cleared frontend-metadata-ids.json');
      
      // Clear genesis displays
      fs.writeFileSync(genesisDisplaysPath, JSON.stringify({}, null, 2), 'utf-8');
      console.log('✅ Cleared genesis-displays.json');
      fs.writeFileSync(objectTypesPath, JSON.stringify(freshObjectTypesData, null, 2), 'utf-8');

      // Also update the .env.local file for the Next.js app with the new package ID and admin cap
      const envPath = config.envFilePath;
      
      // Read existing .env.local content if it exists
      let existingContent = '';
      try {
        existingContent = fs.readFileSync(envPath, 'utf-8');
      } catch (error) {
        // File doesn't exist, start with empty content
        existingContent = '';
      }
      
      // Update or add the contract addresses
      let envContent = existingContent
        .replace(/PACKAGE_ID=.*/g, '')
        .replace(/ADMIN_CAP_ID=.*/g, '')
        .replace(/PUBLISHER_ID=.*/g, '')
        .replace(/UPGRADE_CAP_ID=.*/g, '')
        .replace(/^\s*$/gm, '') // Remove empty lines
        .trim();
      
      // Add new contract addresses
      envContent += `\n\n# Contract Addresses (updated after publishing)\nPACKAGE_ID=${packageID}\nADMIN_CAP_ID=${adminCapObject?.objectId || ''}\nPUBLISHER_ID=${publisherObject?.objectId || ''}\nUPGRADE_CAP_ID=${upgradeCapObject?.objectId || ''}\n`;
      
      console.log('Updating .env.local file with new contract addresses:');
      console.log('- Package ID:', packageID);
      console.log('- Admin Cap ID:', adminCapObject?.objectId || 'NOT FOUND');
      console.log('- Publisher ID:', publisherObject?.objectId || 'NOT FOUND');
      console.log('- Upgrade Cap ID:', upgradeCapObject?.objectId || 'NOT FOUND');
      console.log('- Env file path:', envPath);
      
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log('✅ .env.local file updated successfully');

      // Update documentation files with new contract addresses
      try {
        const { exec } = require('child_process');
        const updateScriptPath = path.join(process.cwd(), 'scripts', 'update-documentation.js');
        
        exec(`node ${updateScriptPath}`, (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.log('Documentation update failed:', error.message);
          } else {
            console.log('Documentation updated successfully:', stdout);
          }
        });
      } catch (error) {
        console.log('Could not run documentation update script:', error);
      }

      // Note: Move.toml should remain with tradingcard = "_" 
      // The Sui CLI automatically resolves this during build

      return NextResponse.json({
        success: true,
        message: 'Contracts published successfully!',
        transactionDigest: txResponse.effects.transactionDigest,
        packageId: packageID,
        adminCapObjectId: adminCapObject?.objectId,
        upgradeCapObjectId: upgradeCapObject?.objectId,
        publisherObjectId: publisherObject?.objectId,
        displayObjectsCount: displayObjects.length,
        allCreatedObjectsCount: createdObjectChanges.length,
        savedToFile: outputPath,
        objectTypesFile: objectTypesPath,
        updatedEnvFile: envPath,
        adminCapId: adminCapObject?.objectId,
        allObjectTypes: allObjectTypes
      });
    } else {
      throw new Error(`Transaction failed: ${txResponse?.effects?.status?.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Error publishing contracts:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to publish contracts',
        details: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
