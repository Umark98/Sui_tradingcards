import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import dotenv from "dotenv";

dotenv.config();

// Sui network configuration
const client = new SuiClient({
  url: process.env.SUI_NETWORK || "https://fullnode.testnet.sui.io:443",
});

async function getSigner() {
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("MNEMONIC not found in .env file");
  }
  const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  return keypair;
}

// Load environment variables
const PACKAGE_ID = process.env.PACKAGE_ID!;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID!;
if (!PACKAGE_ID || !ADMIN_CAP_ID) {
  throw new Error('PACKAGE_ID or ADMIN_CAP_ID not set in .env file');
}

// Genesis card types
const GENESIS_CARD_TYPES = [
  'MissionParisRare',
  'MissionParisEpic',
  'MissionParisLegendary',
  'MissionParisUltraCommon',
  'MissionParisUltraCommonSigned',
  'MissionDublinSuperLegendary',
  'MissionDublinLegendary',
  'MissionDublinEpic',
  'MissionDublinRare',
  'MissionDublinUltraCommonSigned',
  'MissionDublinUltraCommon',
  'MissionNewYorkCityUltraCommon',
  'MissionNewYorkCityLegendary',
  'MissionNewYorkCityEpic',
  'MissionNewYorkCityRare',
  'MissionNewYorkCityUltraCommonSigned',
  'MissionSydneyUltraCommon',
  'MissionSydneyUltraCommonSigned',
  'MissionSydneyRare',
  'MissionSydneyEpic',
  'MissionSydneyLegendary',
  'MissionSanDiegoUltraCommon',
  'MissionSanDiegoUltraCommonSigned',
  'MissionSanDiegoRare',
  'MissionSanDiegoEpic',
  'MissionSanDiegoLegendary',
  'MissionSingaporeUltraCommon',
  'MissionTransylvaniaUltraCommon',
  'MissionTransylvaniaUltraCommonSigned'
];

interface MintGenesisCardParams {
  cardType: string;
  mintNumber: number;
  recipient: string;
}

async function mintGenesisCard({ cardType, mintNumber, recipient }: MintGenesisCardParams) {
  console.log(`Minting Genesis ${cardType} with mint number ${mintNumber} for recipient ${recipient}`);
  
  // Validate card type
  if (!GENESIS_CARD_TYPES.includes(cardType)) {
    throw new Error(`Invalid card type. Must be one of: ${GENESIS_CARD_TYPES.join(', ')}`);
  }

  const tx = new Transaction();
  const signer = await getSigner();
  
  // Set gas budget
  tx.setGasBudget(10000000);

  // Call the mint_and_transfer function from missioncards module
  tx.moveCall({
    target: `${PACKAGE_ID}::missioncards::mint_and_transfer`,
    typeArguments: [`${PACKAGE_ID}::missioncards::${cardType}`],
    arguments: [
      tx.object(ADMIN_CAP_ID), // AdminCap
      tx.pure.u64(mintNumber), // mint_number
      tx.pure.address(recipient), // recipient
    ],
  });

  console.log('Transaction prepared successfully');

  // Execute transaction
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: signer,
    options: {
      showEffects: true,
    },
  });

  // Get minted card object ID
  const mintedCardObjectId = result.effects?.created?.[0]?.reference?.objectId;

  if (!mintedCardObjectId) {
    throw new Error('Minted card object ID not found in transaction results');
  }

  console.log(`Genesis ${cardType} minted successfully!`);
  console.log(`Minted Card Object ID: ${mintedCardObjectId}`);
  console.log(`Transaction Digest: ${result.effects?.transactionDigest}`);

  return {
    mintedCardObjectId,
    transactionDigest: result.effects?.transactionDigest,
    cardType,
    mintNumber,
    recipient
  };
}

// Example usage
async function main() {
  try {
    // Get recipient from environment variable or use signer's address
    const signer = await getSigner();
    const defaultRecipient = process.env.RECIPIENT_ADDRESS || signer.getPublicKey().toSuiAddress();
    
    // Example: Mint MissionParisRare with mint number 1
    const result = await mintGenesisCard({
      cardType: 'MissionParisRare',
      mintNumber: 1,
      recipient: defaultRecipient
    });
    
    console.log('Minting completed:', result);
  } catch (error) {
    console.error('Error minting genesis card:', error);
  }
}

// Export for use in other scripts
export { mintGenesisCard, GENESIS_CARD_TYPES };

// Run if called directly
if (require.main === module) {
  main();
}