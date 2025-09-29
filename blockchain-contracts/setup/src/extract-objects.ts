
import { writeFileSync } from 'fs';
import * as path from 'path';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Transaction digest to query
  const transactionDigest = 'EgYShDVLwUNyidt5aP5Kr5ap78HZLbt2AYC7HR5JqPG7';

  // Connect to Sui testnet
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });

  // Retry fetching transaction block to handle propagation delays
  let txResponse;
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      txResponse = await client.getTransactionBlock({
        digest: transactionDigest,
        options: {
          showObjectChanges: true,
        },
      });
      break; // Exit loop if successful
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch transaction block after ${maxRetries} attempts: ${error.message}`);
      }
      console.log(`Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
      await delay(retryDelay);
    }
  }

  // Extract all Object IDs from objectChanges
  const objectIds = [];
  if (txResponse.objectChanges) {
    for (const change of txResponse.objectChanges) {
      if (change.objectId) {
        objectIds.push({
          objectId: change.objectId,
          type: change.type || 'unknown',
          objectType: change.objectType || 'unknown',
        });
      }
    }
  }

  // Prepare response data
  const responseData = {
    digest: transactionDigest,
    objectIds,
    timestamp: new Date().toISOString(),
  };

  // Save to JSON file
  const outputDir = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.join(outputDir, 'transaction-objects.json');
  writeFileSync(outputPath, JSON.stringify(responseData, null, 2), 'utf-8');

  console.log(`Transaction objects saved to: ${outputPath}`);
  console.log('Object IDs:', objectIds.map((obj) => obj.objectId));
}

main().catch(console.error);
