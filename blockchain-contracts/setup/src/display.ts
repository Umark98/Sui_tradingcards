import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { bcs } from "@mysten/sui/bcs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import dotenv from "dotenv";

dotenv.config();

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

export type DisplayFieldsType = {
    keys: string[];
    values: string[];
};

export async function createDisplay(type: string) {
  const tx = new Transaction();
  const signer = await getSigner();

  let displayObject: DisplayFieldsType = {
    keys: [
      "name",
      "image_url",
      "description",
      "project_url",
      "creator",
      "category",
      "type",
      "mint_number",
      "edition",
      "royalty",
      "treasury_address",
      "artist",
      "copyright"
    ],
    values: [
      `Commemorative Card ${type}`,
      `https://cdn11.bigcommerce.com/s-spem6oukby/images/stencil/1280x1280/products/123/436/2D__57497__49826.1681470474.jpg?c=1`,
      `A unique Genesis ${type} collectible card`,
      "https://www.tradingcard.com",
      "TradingCard Team",
      "Collectible",
      "Genesis Card",
      "0",
      "Limited Edition",
      "5%",
      "0xb73f130f70ce3fda909699b2978da240d73d1c6c85a2ef3624819b42641bd681",
      "Card Artist",
      "© 2025 TradingCard"
    ],
  };

  const publisherID = process.env.PUBLISHER_ID || "";
  const packageID = process.env.PACKAGE_ID || "";

  if (!publisherID || !packageID) {
    throw new Error("PUBLISHER_ID or PACKAGE_ID not found in .env file");
  }

  tx.setGasBudget(10000000);

  let display = tx.moveCall({
    target: "0x2::display::new_with_fields",
    arguments: [
      tx.object(publisherID),
      tx.pure(bcs.vector(bcs.string()).serialize(displayObject.keys)),
      tx.pure(bcs.vector(bcs.string()).serialize(displayObject.values))
    ],
    typeArguments: [`${packageID}::trading_card_genesis::Genesis<${packageID}::trading_card_genesis::${type}>`],
  });

  tx.moveCall({
    target: "0x2::display::update_version",
    arguments: [display],
    typeArguments: [`${packageID}::trading_card_genesis::Genesis<${packageID}::trading_card_genesis::${type}>`],
  });

  tx.transferObjects([display], signer.getPublicKey().toSuiAddress());

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: signer,
    options: {
      showEffects: true,
    },
  });

  const display_id = (result.effects?.created &&
    result.effects?.created[0].reference.objectId) as string;

  console.log("Display created successfully");

  return display_id;
}

// Example usage for CommemorativeCard1
createDisplay("CommemorativeCard2");