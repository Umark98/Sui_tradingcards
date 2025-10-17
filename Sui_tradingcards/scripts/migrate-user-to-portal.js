/**
 * Migrate User to Portal Script
 * 
 * This script migrates a user from the legacy users table to the portal_users table
 * with a new custodial wallet.
 * 
 * Usage: node scripts/migrate-user-to-portal.js <email>
 */

const { Pool } = require('pg');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const crypto = require('crypto');

// Database configuration
const pool = new Pool({
  host: process.env.PGSQL_HOST || 'localhost',
  port: Number(process.env.PGSQL_PORT) || 5432,
  database: process.env.PGSQL_DATABASE || 'tradingdb',
  user: process.env.PGSQL_USER || 'postgres',
  password: process.env.PGSQL_PASSWORD || '',
  options: '-c search_path=public'
});

// Generate a new custodial wallet (matches walletUtils.ts logic)
function generateCustodialWallet() {
  const keypair = new Ed25519Keypair();
  const publicKey = keypair.getPublicKey();
  const address = publicKey.toSuiAddress();
  const privateKey = keypair.export().privateKey;

  return {
    address,
    privateKey,
    publicKey: publicKey.toBase64(),
  };
}

// Encrypt private key (matches walletUtils.ts logic)
function encryptPrivateKey(privateKey) {
  const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

async function migrateUserToPortal(email) {
  const client = await pool.connect();

  try {
    console.log(`🔍 Looking up user: ${email}`);
    
    // Check if user exists in legacy users table
    const legacyUserResult = await client.query(
      'SELECT * FROM users WHERE user_email = $1',
      [email.toLowerCase()]
    );

    if (legacyUserResult.rows.length === 0) {
      console.log(`❌ User ${email} not found in legacy users table`);
      return;
    }

    const legacyUser = legacyUserResult.rows[0];
    console.log(`📋 Legacy user record:`);
    console.log(`   ID: ${legacyUser.user_id}`);
    console.log(`   Email: ${legacyUser.user_email}`);
    console.log(`   Old Wallet: ${legacyUser.wallet_address}`);
    console.log(`   Created: ${legacyUser.wallet_created_at}`);

    // Check if user already exists in portal
    const portalUserResult = await client.query(
      'SELECT * FROM portal_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (portalUserResult.rows.length > 0) {
      console.log(`⚠️  User ${email} already exists in portal_users table`);
      console.log(`   Portal Wallet: ${portalUserResult.rows[0].custodial_wallet}`);
      console.log(`   Portal Verified: ${portalUserResult.rows[0].verified}`);
      return;
    }

    // Generate new wallet
    console.log(`\n🔧 Generating new custodial wallet...`);
    const newWallet = generateCustodialWallet();
    const encryptedPrivateKey = encryptPrivateKey(newWallet.privateKey);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    console.log(`✅ New wallet generated:`);
    console.log(`   Address: ${newWallet.address}`);
    console.log(`   Public Key: ${newWallet.publicKey}`);
    console.log(`   Private Key (encrypted): ${encryptedPrivateKey.slice(0, 20)}...`);

    // Insert into portal_users table
    console.log(`\n💾 Creating portal user record...`);
    const insertResult = await client.query(
      `INSERT INTO portal_users (email, custodial_wallet, encrypted_private_key, verification_token, verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, custodial_wallet, verified, created_at`,
      [email.toLowerCase(), newWallet.address, encryptedPrivateKey, verificationToken, true]
    );

    if (insertResult.rows.length > 0) {
      const portalUser = insertResult.rows[0];
      console.log(`✅ Portal user created successfully!`);
      console.log(`   Portal ID: ${portalUser.id}`);
      console.log(`   New Wallet: ${portalUser.custodial_wallet}`);
      console.log(`   Verified: ${portalUser.verified}`);
      console.log(`   Created: ${portalUser.created_at}`);

      // Log the activity
      await client.query(
        `INSERT INTO user_activity_log (email, activity_type, activity_data)
         VALUES ($1, $2, $3)`,
        [email.toLowerCase(), 'user_migrated_to_portal', { 
          legacyUserId: legacyUser.user_id,
          oldWallet: legacyUser.wallet_address,
          newWallet: newWallet.address,
          timestamp: new Date().toISOString()
        }]
      );

      console.log(`\n📝 Activity logged in user_activity_log table`);

      // Display wallet details for admin
      console.log(`\n🔑 WALLET DETAILS FOR ADMIN:`);
      console.log(`   Email: ${email}`);
      console.log(`   New Wallet Address: ${newWallet.address}`);
      console.log(`   Private Key (Base64): ${newWallet.privateKey}`);
      console.log(`   Public Key (Base64): ${newWallet.publicKey}`);
      console.log(`   Verification Token: ${verificationToken}`);
      console.log(`\n⚠️  IMPORTANT: Save these details securely!`);

      // Show migration summary
      console.log(`\n📊 MIGRATION SUMMARY:`);
      console.log(`   ✅ User migrated from legacy system to portal`);
      console.log(`   ✅ New custodial wallet generated`);
      console.log(`   ✅ User is verified and ready to use portal`);
      console.log(`   ✅ Old wallet: ${legacyUser.wallet_address}`);
      console.log(`   ✅ New wallet: ${newWallet.address}`);

    } else {
      console.log(`❌ Failed to create portal user record`);
    }

  } catch (error) {
    console.error(`❌ Error migrating user:`, error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Main execution
const email = process.argv[2];

if (!email) {
  console.log('❌ Usage: node scripts/migrate-user-to-portal.js <email>');
  console.log('   Example: node scripts/migrate-user-to-portal.js mohammediblal@hotmail.com');
  process.exit(1);
}

migrateUserToPortal(email)
  .then(() => {
    console.log('\n✨ User migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
