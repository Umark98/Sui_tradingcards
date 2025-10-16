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
const LEVEL = parseInt(process.env.LEVEL || '1');
const NEW_PRIMARY_URL = process.env.NEW_PRIMARY_URL!;
const TYPE_T = `${PACKAGE_ID}::gadget_gameplay_items::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${CARD_TYPE}>`;

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

async function updateCardImage() {
  const obj = await client.getObject({ id: METADATA_ID, options: { showContent: true } });
  const fields = obj.data?.content?.fields;
  const current_version = parseInt(fields.version);

  const keys = [1, 2, 3];
  const levelIndex = LEVEL - 1;

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::gadget_gameplay_items::edit_metadata`,
    typeArguments: [TYPE_T],
    arguments: [
      tx.object(ADMIN_CAP_ID),
      tx.object(METADATA_ID),
      tx.pure.u16(current_version + 1),
      tx.pure.vector('u16', keys),
      tx.pure.option('string', fields.game?.fields.vec[0]?.fields || null),
      tx.pure.string(fields.description),
      tx.pure.vector('string', keys.map(k => fields.rarity.fields.contents[k-1].fields.value)),
      tx.pure.vector('string', keys.map(k => fields.enhancements.fields.contents[k-1].fields.value)),
      tx.pure.option('u64', fields.episode_utility?.fields.vec[0]?.fields || null),
      tx.pure.string(fields.transferability),
      tx.pure.u16(parseInt(fields.royalty)),
      tx.pure.option('string', fields.unlock_currency?.fields.vec[0]?.fields || null),
      tx.pure.vector('u64', keys.map(k => BigInt(fields.unlock_threshold.fields.contents[k-1].fields.value))),
      tx.pure.option('string', fields.edition?.fields.vec[0]?.fields || null),
      tx.pure.option('string', fields.set?.fields.vec[0]?.fields || null),
      tx.pure.bool(fields.upgradeable),
      tx.pure.vector('string', keys.map((k, i) => k === LEVEL ? NEW_PRIMARY_URL : fields.media_urls_primary.fields.contents[i].fields.value)),
      tx.pure.vector('string', keys.map((k, i) => k === LEVEL ? NEW_PRIMARY_URL : fields.media_urls_display.fields.contents[i].fields.value)),
      tx.pure.vector('u16', keys.map(k => parseInt(fields.ranks.fields.contents[k-1].fields.value))),
      tx.pure.string(fields.sub_type),
      tx.pure.option('u16', fields.season?.fields.vec[0]?.fields || null),
    ],
  });

  const result = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
  console.log(`\n✅ IMAGE UPDATED FOR ${CARD_TYPE} LEVEL ${LEVEL}!`);
  console.log('New Image:', NEW_PRIMARY_URL);
}

updateCardImage().catch(console.error);