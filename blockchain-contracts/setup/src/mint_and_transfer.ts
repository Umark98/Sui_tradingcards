import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { config } from 'dotenv';

config({ path: './.env' });

const keypair = Ed25519Keypair.deriveKeypair(process.env.SUI_MNEMONIC!);
const PACKAGE_ID = process.env.PACKAGE_ID!;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID!;
const METADATA_ID = process.env.METADATA_ID!;
const CARD_TYPE = process.env.CARD_TYPE || 'Yoyo';
const TYPE_T = `${PACKAGE_ID}::gadget_gameplay_items::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${CARD_TYPE}>`;

const TITLE = process.env.CARD_TITLE || 'Golden Yoyo';
const LEVEL = parseInt(process.env.CARD_LEVEL || '1');
const MINTED_NUMBER = parseInt(process.env.MINTED_NUMBER || '1');
const RECIPIENT = process.env.RECIPIENT_ADDRESS || keypair.toSuiAddress();

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

async function mintAndTransfer() {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::gadget_gameplay_items::mint_and_transfer`,
    typeArguments: [TYPE_T],
    arguments: [
      tx.object(ADMIN_CAP_ID),
      tx.object(METADATA_ID),
      tx.pure.string(TITLE),
      tx.pure.u16(LEVEL),
      tx.pure.id(METADATA_ID),
      tx.pure.u64(MINTED_NUMBER),
      tx.pure.address(RECIPIENT),
    ],
  });

  const result = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
  const nftId = result.objectChanges?.find(c => c.type === 'Created')?.objectId;
  console.log(`\n✅ ${TITLE} MINTED!`);
  console.log('NFT_ID=' + nftId);
}

mintAndTransfer().catch(console.error);














// // src/mint_and_transfer.ts
// // Script to call mint_and_transfer function on Sui blockchain

// import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
// import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
// import { Transaction } from '@mysten/sui/transactions';
// import { config } from 'dotenv';

// config({ path: './.env' }); // Load .env from parent directory

// // Derive keypair from mnemonic
// const mnemonic = process.env.SUI_MNEMONIC!;
// if (!mnemonic) {
//   throw new Error('SUI_MNEMONIC not set in .env file');
// }
// const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

// // Load environment variables
// const PACKAGE_ID = process.env.PACKAGE_ID!;
// const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID!;
// const METADATA_ID = process.env.METADATA_ID!; // 👈 FIXED: Use METADATA_ID from mint script
// if (!PACKAGE_ID || !ADMIN_CAP_ID || !METADATA_ID) {
//   throw new Error('PACKAGE_ID, ADMIN_CAP_ID, or METADATA_ID not set in .env file');
// }

// // Constants for the Move module
// const MODULE_NAME = 'gadget_gameplay_items';
// const FUNCTION_NAME = 'mint_and_transfer';
// const CARD_TYPE = process.env.CARD_TYPE || 'YellowHandkerchief';
// const TYPE_T = `${PACKAGE_ID}::${MODULE_NAME}::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${CARD_TYPE}>`;

// // Load from environment variables or use defaults
// const title = process.env.CARD_TITLE || 'Handkerchief';
// const level = parseInt(process.env.CARD_LEVEL || '1');
// const minted_number = parseInt(process.env.MINTED_NUMBER || '1');
// const recipient = process.env.RECIPIENT_ADDRESS || keypair.toSuiAddress(); // 👈 Default to your address

// // Setup client
// const client = new SuiClient({
//   url: getFullnodeUrl(process.env.SUI_NETWORK || 'testnet'),
// });

// async function mintAndTransfer() {
//   try {
//     console.log('🔑 Using AdminCap:', ADMIN_CAP_ID);
//     console.log('📝 Metadata ID:', METADATA_ID);
//     console.log('🎴 Card Details:', { title, level, minted_number, recipient });
    
//     const tx = new Transaction();

//     tx.moveCall({
//       target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
//       typeArguments: [TYPE_T],
//       arguments: [
//         // 1. &AdminCap
//         tx.object(ADMIN_CAP_ID),
//         // 2. &mut Metadata (REFERENCE - not pure.id!)
//         tx.object(METADATA_ID),
//         // 3. title: String
//         tx.pure.string(title),
//         // 4. level: u16
//         tx.pure.u16(level),
//         // 5. metadata: ID (PURE ID)
//         tx.pure.id(METADATA_ID),
//         // 6. minted_number: u64
//         tx.pure.u64(minted_number),
//         // 7. recipient: address
//         tx.pure.address(recipient),
//         // 👈 SDK AUTO-ADDS #8: ctx: &mut TxContext
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

//     // 👇 AUTO-EXTRACT NFT ID!
//     const nftChange = result.objectChanges?.find(change => 
//       change.type === 'Created' && 
//       change.content?.type?.includes('GadgetGameplayItem')
//     );
//     const nftId = nftChange?.objectId || 'NOT_FOUND';

//     console.log('\n✅ CARD MINTED & TRANSFERRED!');
//     console.log('Transaction Digest:', result.digest);
//     console.log('🎯 NFT_ID:', nftId);
//     console.log('💡 COPY THIS TO .env: NFT_ID=' + nftId);
//     console.log('👤 Sent to:', recipient);

//   } catch (error) {
//     console.error('Error executing mint_and_transfer:', error);
//     throw error;
//   }
// }

// mintAndTransfer().catch(console.error);