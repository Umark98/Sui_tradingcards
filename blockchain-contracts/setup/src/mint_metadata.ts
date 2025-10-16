import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { config } from 'dotenv';

config({ path: './.env' });

const keypair = Ed25519Keypair.deriveKeypair(process.env.SUI_MNEMONIC!);
const PACKAGE_ID = process.env.PACKAGE_ID!;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID!;
const CARD_TYPE = process.env.CARD_TYPE || 'Yoyo';
const TYPE_T = `${PACKAGE_ID}::gadget_gameplay_items::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${CARD_TYPE}>`;

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

async function mintMetadata() {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::gadget_gameplay_items::mint_metadata`,
    typeArguments: [TYPE_T],
    arguments: [
      tx.object(ADMIN_CAP_ID),
      tx.pure.u16(1),
      tx.pure.vector('u16', [1, 2, 3]),
      tx.pure.option('string', 'InspectorGadgetGame'),
      tx.pure.string('Limited edition Inspector Gadget gameplay item.'),
      tx.pure.vector('string', ['Common', 'UnCommon', 'EPIC']),
      tx.pure.vector('string', ['None', 'Boost', 'Health']),
      tx.pure.option('u64', 6n),
      tx.pure.string('Platform'),
      tx.pure.u16(500),
      tx.pure.option('string', 'GADGET_COIN'),
      tx.pure.vector('u64', [100n, 200n, 500n]),
      tx.pure.option('string', 'First Edition'),
      tx.pure.option('string', 'Season 1'),
      tx.pure.bool(true),
      tx.pure.vector('string', [
        'https://example.com/media/primary1.png',
        'https://example.com/media/primary2.png', 
        'https://example.com/media/primary3.png'
      ]),
      tx.pure.vector('string', [
        'https://example.com/media/display1.png',
        'https://example.com/media/display2.png',
        'https://example.com/media/display3.png'
      ]),
      tx.pure.vector('u16', [1, 2, 3]),
      tx.pure.string('TradingCard'),
      tx.pure.option('u16', 1),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showObjectChanges: true },
  });

  const metadataId = result.objectChanges?.find(c => c.type === 'Created')?.objectId;
  console.log('\n✅ METADATA MINTED!');
  console.log('METADATA_ID=' + metadataId);
}

mintMetadata().catch(console.error);


























// import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
// import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
// import { Transaction } from '@mysten/sui/transactions';
// import { config } from 'dotenv';

// config({ path: './.env' }); // Load .env

// // Derive keypair
// const mnemonic = process.env.SUI_MNEMONIC!;
// if (!mnemonic) throw new Error('SUI_MNEMONIC not set in .env file');
// const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

// // Env vars
// const PACKAGE_ID = process.env.PACKAGE_ID!;
// const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID!;
// if (!PACKAGE_ID || !ADMIN_CAP_ID) throw new Error('PACKAGE_ID or ADMIN_CAP_ID not set in .env file');

// const MODULE_NAME = 'gadget_gameplay_items';
// const FUNCTION_NAME = 'mint_metadata';
// const CARD_TYPE = process.env.CARD_TYPE || 'YellowHandkerchief';
// const TYPE_T = `${PACKAGE_ID}::${MODULE_NAME}::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${CARD_TYPE}>`;

// // ===============================
// //  REMOVED ALL GEMS/BUCKS VALUES
// // ===============================
// const version = 1;
// const keys = [1, 2, 3];
// const game = 'InspectorGadgetGame';
// const description = 'Limited edition Inspector Gadget gameplay item.';
// const rarity_values = ['Common', 'UnCommon', 'EPIC'];
// const enhancement_values = ['None', 'Boost', 'Health'];
// const episode_utility = 6;
// const transferability = 'Platform';
// const royalty = 500;
// const unlock_currency = 'GADGET_COIN';
// const unlock_threshold_values = [100, 200, 500];
// const edition = 'First Edition';
// const set = 'Season 1';
// const upgradeable = true;
// const media_urls_primary_values = [
//   'https://example.com/media/primary1.png',
//   'https://example.com/media/primary2.png',
//   'https://example.com/media/primary3.png',
// ];
// const media_urls_display_values = [
//   'https://example.com/media/display1.png',
//   'https://example.com/media/display2.png',
//   'https://example.com/media/display3.png',
// ];
// const rank_values = [1, 2, 3];
// const sub_type = 'TradingCard';
// const season = 1;

// // Sui client setup
// const client = new SuiClient({
//   url: getFullnodeUrl(process.env.SUI_NETWORK || 'testnet'),
// });

// async function mintMetadata() {
//   try {
//     const tx = new Transaction();

//     // 🔻 GEMS/BUCKS ARGUMENTS REMOVED 🔻
//     tx.moveCall({
//       target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
//       typeArguments: [TYPE_T],
//       arguments: [
//         tx.object(ADMIN_CAP_ID),
//         tx.pure.u16(version),
//         tx.pure.vector('u16', keys),
//         tx.pure.option('string', game),
//         tx.pure.string(description),
//         tx.pure.vector('string', rarity_values),
//         tx.pure.vector('string', enhancement_values),
//         tx.pure.option('u64', episode_utility),
//         tx.pure.string(transferability),
//         tx.pure.u16(royalty),
//         tx.pure.option('string', unlock_currency),
//         tx.pure.vector('u64', unlock_threshold_values),
//         tx.pure.option('string', edition),
//         tx.pure.option('string', set),
//         tx.pure.bool(upgradeable),
//         tx.pure.vector('string', media_urls_primary_values),
//         tx.pure.vector('string', media_urls_display_values),
//         tx.pure.vector('u16', rank_values),
//         tx.pure.string(sub_type),
//         tx.pure.option('u16', season),
//       ],
//     });

//     const result = await client.signAndExecuteTransaction({
//       signer: keypair,
//       transaction: tx,
//       options: {
//         showEffects: true,
//         showObjectChanges: true,
//       },
//     });

//     console.log('Transaction Digest:', result.digest);
//     console.log('Transaction Effects:', JSON.stringify(result.effects, null, 2));
//     console.log('Object Changes:', JSON.stringify(result.objectChanges, null, 2));
//   } catch (error) {
//     console.error('Error executing mint_metadata:', error);
//     throw error;
//   }
// }

// mintMetadata().catch(console.error);
