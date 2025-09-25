// src/mint_and_transfer.ts
// Script to call mint_and_transfer function on Sui blockchain

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { config } from 'dotenv';

config({ path: './.env' }); // Load .env from parent directory

// Derive keypair from mnemonic
const mnemonic = process.env.SUI_MNEMONIC!;
if (!mnemonic) {
  throw new Error('SUI_MNEMONIC not set in .env file');
}
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

// Load environment variables
const PACKAGE_ID = process.env.PACKAGE_ID!;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID!;
if (!PACKAGE_ID || !ADMIN_CAP_ID) {
  throw new Error('PACKAGE_ID or ADMIN_CAP_ID not set in .env file');
}

// Constants for the Move module
const MODULE_NAME = 'gadget_gameplay_items';
const FUNCTION_NAME = 'mint_and_transfer';
const TYPE_T = `${PACKAGE_ID}::${MODULE_NAME}::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::YellowHandkerchief>`;

// Replace with actual values after running mint_metadata
const METADATA_OBJECT_ID = '0x7610c46dcae00cbbc60426693a25a87a58926ff8388701c11dee5f9f184d4393'; // Replace with actual ID from mint_metadata
const metadata_id = METADATA_OBJECT_ID; // Same as METADATA_OBJECT_ID for the metadata ID parameter
const title = 'Example Yoyo Card';
const level = 1;
const minted_number = 12001;
const recipient = '0x0994d90f976c70874d7f1eeff961ec4174885b7068a18c0a3a4655eb86ad9b6d'; // Replace with actual recipient address

// Setup client
const client = new SuiClient({
  url: getFullnodeUrl('testnet'), // Change to 'mainnet' if needed
});

async function mintAndTransfer() {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
      typeArguments: [TYPE_T],
      arguments: [
        tx.object(ADMIN_CAP_ID),
        tx.object(METADATA_OBJECT_ID),
        tx.pure.string(title),
        tx.pure.u16(level),
        tx.pure.id(metadata_id),
        tx.pure.u64(minted_number),
        tx.pure.address(recipient),
      ],
    });

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('Transaction Digest:', result.digest);
    console.log('Transaction Effects:', JSON.stringify(result.effects, null, 2));
    console.log('Object Changes:', JSON.stringify(result.objectChanges, null, 2));
  } catch (error) {
    console.error('Error executing mint_and_transfer:', error);
    throw error;
  }
}

mintAndTransfer().catch(console.error);