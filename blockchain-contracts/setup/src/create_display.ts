import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { config } from 'dotenv';

config({ path: './.env' });

const keypair = Ed25519Keypair.deriveKeypair(process.env.SUI_MNEMONIC!);
const PACKAGE_ID = process.env.PACKAGE_ID!;
const PUBLISHER_ID = process.env.PUBLISHER_ID!;
const CARD_TYPE = process.env.CARD_TYPE || 'Yoyo';
const TYPE_T = `${PACKAGE_ID}::gadget_gameplay_items::GadgetGameplayItem<${PACKAGE_ID}::gadget_gameplay_items_titles::${CARD_TYPE}>`;

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

async function createDisplay() {
  const tx = new Transaction();
  const display = tx.moveCall({
    target: `${PACKAGE_ID}::gadget_gameplay_items_display::gadget_gameplay_items_display`,
    typeArguments: [TYPE_T],
    arguments: [tx.object(PUBLISHER_ID)],
  });
  tx.transferObjects([display], keypair.toSuiAddress());

  const result = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
  const displayId = result.objectChanges?.find(c => c.type === 'Created')?.objectId;
  console.log(`\n✅ DISPLAY CREATED FOR ${CARD_TYPE}!`);
  console.log('DISPLAY_ID=' + displayId);
}

createDisplay().catch(console.error);