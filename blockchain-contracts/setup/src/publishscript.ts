import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { execSync } from "child_process";
import * as fs from "fs";
import dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The Sui network to connect to.
const SUI_NETWORK = getFullnodeUrl("testnet");

// Paths to the Move CLI and the root of your packages
const cliPath = "/Users/apple/.cargo/bin/sui";

// Define the path for the contract you want to publish.
// Based on your folder structure, the contracts are in a single `sources` directory.
const packagePath = "../../sources";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Retrieves a Sui signer from a mnemonic phrase.
 * @returns An Ed25519Keypair instance to be used as a signer.
 */
async function getSigner() {
  // Try to get mnemonic from environment variables first
  let mnemonic = process.env.SUI_MNEMONIC;
  
  // If not found in env, prompt user to provide it
  if (!mnemonic) {
    console.log('SUI_MNEMONIC not found in environment variables.');
    console.log('Please provide your mnemonic phrase (or create a .env file with SUI_MNEMONIC=your_mnemonic):');
    throw new Error('SUI_MNEMONIC not found. Please add it to your .env file or provide it directly.');
  }
  
  const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  return keypair;
}

// Initialize the Sui client
const client = new SuiClient({
  url: SUI_NETWORK,
});

/**
 * Publishes a Sui Move package.
 * @param path The path to the contract directory.
 */
async function publishContract(path: string) {
  try {
    const signer = await getSigner();

    console.log(`\n--- Publishing package at: ${path} ---`);
    const tx = new Transaction();

    let modules, dependencies;

    // Build the Move package and get the bytecode
    try {
      ({ modules, dependencies } = JSON.parse(
        execSync(
          `${cliPath} move build --dump-bytecode-as-base64 --path sources`,
          { 
            encoding: "utf-8",
            cwd: "/Users/apple/Downloads/Work/blockchain-contracts" // Change to blockchain-contracts directory
          }
        )
      ));
    } catch (buildErr) {
      console.error(`Failed to build package at ${path}:`, buildErr);
      return; // Exit if the build fails
    }
    
    // Set a generous gas budget for the transaction
    const gasBudget = 300000000;
    tx.setGasBudget(gasBudget);

    // Publish the package
    const [upgradeCap] = tx.publish({
      modules,
      dependencies,
    });

    // Transfer the upgrade capability to the signer's address
    tx.transferObjects(
      [upgradeCap],
      tx.pure.address(signer.getPublicKey().toSuiAddress())
    );

    // Sign and execute the transaction
    const txRes = await client.signAndExecuteTransaction({
      transaction: tx,
      signer,
      requestType: "WaitForLocalExecution",
      options: {
        showEvents: true,
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
        showInput: true,
      },
    });

    // Check if the transaction was successful
    if (txRes?.effects?.status?.status === "success") {
      const createdObjects = txRes.effects.created || [];

      // Find the package ID from the created objects
      const packageID: any = createdObjects?.find(
        (item) => item.owner === "Immutable"
      )?.reference.objectId;

      // The dotenv library is no longer used, but if you want to write to an env file, you would do it here.
      // For now, we will just log the details.
      
      console.log(`✅ Successfully published package`);
      console.log(`   - Package ID: ${packageID}`);
      console.log(`   - Transaction Digest: ${txRes?.effects?.transactionDigest}`);
    } else {
      console.error(`❌ Publishing failed for package at ${path}`);
      console.error(`   - Status: ${txRes?.effects?.status?.status}`);
      console.error(`   - Error: ${txRes?.effects?.status?.error}`);
      console.error(`   - Transaction Digest: ${txRes?.effects?.transactionDigest}`);
      throw new Error(`Publishing failed for package at ${path}: ${txRes?.effects?.status?.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error("An error occurred during publishing:", err);
  }
}

// Run the function to publish the contract
publishContract(packagePath);
