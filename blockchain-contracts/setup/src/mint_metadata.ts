// src/mint_metadata.ts
// Script to call mint_metadata function on Sui blockchain

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
const FUNCTION_NAME = 'mint_metadata';
const TYPE_T = `${PACKAGE_ID}::${MODULE_NAME}::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::YellowHandkerchief>`;

// Hardcoded arguments based on provided example
const version = 1;
const keys = [1, 2, 3];
const game = 'InspectorGadgetGame'; // Option<String> some
const description = 'Limited edition Inspector Gadget gameplay item.';
const rarity_values = ['Common', 'UnCommon', 'EPIC'];
const enhancement_values = ['None', 'Boost', 'Health'];
const episode_utility = 6; // Option<u64> some
const transferability = 'Platform';
const royalty = 500;
const unlock_currency = 'GADGET_COIN'; // Option<String> some
const unlock_threshold_values = [100, 200, 500];
const edition = 'First Edition'; // Option<String> some
const set = 'Season 1'; // Option<String> some
const upgradeable = true;
const media_urls_primary_values = [
  'https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2021%2F10%2Fbored-ape-yacht-club-nft-3-4-million-record-sothebys-metaverse-0.jpg?w=960&cbr=1&q=90&fit=max',
  'https://example.com/media/primary2.png',
  'https://example.com/media/primary3.png'
];
const media_urls_display_values = [
  'https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2021%2F10%2Fbored-ape-yacht-club-nft-3-4-million-record-sothebys-metaverse-0.jpg?w=960&cbr=1&q=90&fit=max',
  'https://example.com/media/primary2.png',
  'https://example.com/media/primary3.png'
];
const rank_values = [1, 2, 3];
const sub_type = 'TradingCard';
const season = 1; // Option<u16> some

// Setup client
const client = new SuiClient({
  url: getFullnodeUrl('testnet'), // Change to 'mainnet' if needed
});

async function mintMetadata() {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
      typeArguments: [TYPE_T],
      arguments: [
        tx.object(ADMIN_CAP_ID),
        tx.pure.u16(version),
        tx.pure.vector('u16', keys),
        tx.pure.option('string', game),
        tx.pure.string(description),
        tx.pure.vector('string', rarity_values),
        tx.pure.vector('string', enhancement_values),
        tx.pure.option('u64', episode_utility),
        tx.pure.string(transferability),
        tx.pure.u16(royalty),
        tx.pure.option('string', unlock_currency),
        tx.pure.vector('u64', unlock_threshold_values),
        tx.pure.option('string', edition),
        tx.pure.option('string', set),
        tx.pure.bool(upgradeable),
        tx.pure.vector('string', media_urls_primary_values),
        tx.pure.vector('string', media_urls_display_values),
        tx.pure.vector('u16', rank_values),
        tx.pure.string(sub_type),
        tx.pure.option('u16', season),
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
    console.error('Error executing mint_metadata:', error);
    throw error;
  }
}

mintMetadata().catch(console.error);