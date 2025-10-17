// src/edit_metadata.ts
// Script to call edit_metadata function on Sui blockchain

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
const METADATA_OBJECT_ID = process.env.METADATA_OBJECT_ID!; // The metadata object to edit
if (!PACKAGE_ID || !ADMIN_CAP_ID || !METADATA_OBJECT_ID) {
  throw new Error('PACKAGE_ID, ADMIN_CAP_ID, or METADATA_OBJECT_ID not set in .env file');
}

// Constants for the Move module
const MODULE_NAME = 'gadget_gameplay_items';
const FUNCTION_NAME = 'edit_metadata';
const CARD_TYPE = process.env.CARD_TYPE || 'YellowHandkerchief'; // Set this in environment
const TYPE_T = `${PACKAGE_ID}::${MODULE_NAME}::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${CARD_TYPE}>`;

// Get arguments from environment variables or use defaults
const version = parseInt(process.env.VERSION || '2');
const keys = JSON.parse(process.env.KEYS || '[1, 2, 3]');
const game = process.env.GAME || 'InspectorGadgetGame';
const description = process.env.DESCRIPTION || 'Updated limited edition Inspector Gadget gameplay item with enhanced features.';
const rarity_values = JSON.parse(process.env.RARITY_VALUES || '["Common", "UnCommon", "EPIC"]');
const enhancement_values = JSON.parse(process.env.ENHANCEMENT_VALUES || '["None", "Boost", "Health"]');
const episode_utility = process.env.EPISODE_UTILITY ? parseInt(process.env.EPISODE_UTILITY) : 6;
const transferability = process.env.TRANSFERABILITY || 'Platform';
const royalty = parseInt(process.env.ROYALTY || '500');
const unlock_currency = process.env.UNLOCK_CURRENCY || 'GADGET_COIN';
const unlock_threshold_values = JSON.parse(process.env.UNLOCK_THRESHOLD_VALUES || '[100, 200, 500]');
const edition = process.env.EDITION || 'First Edition';
const set = process.env.SET || 'Season 1';
const upgradeable = process.env.UPGRADEABLE === 'true';
const media_urls_primary_values = JSON.parse(process.env.MEDIA_URLS_PRIMARY_VALUES || '["https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2021%2F10%2Fbored-ape-yacht-club-nft-3-4-million-record-sothebys-metaverse-0.jpg?w=960&cbr=1&q=90&fit=max", "https://example.com/media/primary2.png", "https://example.com/media/primary3.png"]');
const media_urls_display_values = JSON.parse(process.env.MEDIA_URLS_DISPLAY_VALUES || '["https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2021%2F10%2Fbored-ape-yacht-club-nft-3-4-million-record-sothebys-metaverse-0.jpg?w=960&cbr=1&q=90&fit=max", "https://example.com/media/primary2.png", "https://example.com/media/primary3.png"]');
const rank_values = JSON.parse(process.env.RANK_VALUES || '[1, 2, 3]');
const sub_type = process.env.SUB_TYPE || 'TradingCard';
const season = process.env.SEASON ? parseInt(process.env.SEASON) : 1;

// Setup client
const client = new SuiClient({
  url: getFullnodeUrl(process.env.SUI_NETWORK || 'testnet'),
});

async function editMetadata() {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
      typeArguments: [TYPE_T],
      arguments: [
        tx.object(ADMIN_CAP_ID),
        tx.object(METADATA_OBJECT_ID), // The metadata object to edit
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
    console.error('Error executing edit_metadata:', error);
    throw error;
  }
}

editMetadata().catch(console.error);
