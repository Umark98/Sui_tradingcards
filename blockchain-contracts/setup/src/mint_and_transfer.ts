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
const CARD_TYPE = process.env.CARD_TYPE || 'YellowHandkerchief'; // Set this in environment
const TYPE_T = `${PACKAGE_ID}::${MODULE_NAME}::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${CARD_TYPE}>`;

// Load from environment variables or use defaults
const METADATA_OBJECT_ID = process.env.METADATA_OBJECT_ID || ''; // Set this after running mint_metadata
const metadata_id = METADATA_OBJECT_ID; // Same as METADATA_OBJECT_ID for the metadata ID parameter
const title = process.env.CARD_TITLE || 'Example Trading Card';
const level = parseInt(process.env.CARD_LEVEL || '1');
const minted_number = parseInt(process.env.MINTED_NUMBER || '1');
const recipient = process.env.RECIPIENT_ADDRESS || ''; // Must be set in environment

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