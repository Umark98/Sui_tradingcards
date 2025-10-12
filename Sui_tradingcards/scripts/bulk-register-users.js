/**
 * Bulk User Registration Script
 * 
 * This script bulk registers users from the legacy database into the portal system.
 * Each user gets a custodial wallet automatically.
 * 
 * Usage: node scripts/bulk-register-users.js [--dry-run]
 */

const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGSQL_HOST,
  port: process.env.PGSQL_PORT,
  database: process.env.PGSQL_DATABASE,
  user: process.env.PGSQL_USER,
  password: process.env.PGSQL_PASSWORD,
});

// Simple wallet generation (matches walletUtils.ts logic)
function generateSimpleWallet() {
  // Generate a random "wallet address" for demo purposes
  // In production, this would use actual Sui SDK
  const address = '0x' + crypto.randomBytes(32).toString('hex');
  const privateKey = crypto.randomBytes(32).toString('base64');
  return { address, privateKey };
}

// Simple encryption (matches walletUtils.ts logic)
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

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function bulkRegisterUsers() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting Bulk User Registration...\n');
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

    // Get all unique users from legacy database
    const usersResult = await client.query(`
      SELECT DISTINCT user_email, COUNT(nft_id) as nft_count
      FROM users u
      JOIN nfts n ON u.user_id = n.user_id
      GROUP BY user_email
      ORDER BY nft_count DESC
    `);

    console.log(`📊 Found ${usersResult.rows.length} users in legacy database\n`);

    let registered = 0;
    let skipped = 0;
    let errors = [];

    for (const user of usersResult.rows) {
      const email = user.user_email.toLowerCase();

      try {
        // Check if user already exists in portal
        const existingUser = await client.query(
          'SELECT email FROM portal_users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          console.log(`⏭️  ${email} - Already registered (${user.nft_count} NFTs)`);
          skipped++;
          continue;
        }

        if (!isDryRun) {
          // Generate wallet
          const wallet = generateSimpleWallet();
          const encryptedKey = encryptPrivateKey(wallet.privateKey);
          const verificationToken = crypto.randomBytes(32).toString('hex');

          // Insert into portal_users
          await client.query(
            `INSERT INTO portal_users (email, custodial_wallet, encrypted_private_key, verification_token, verified)
             VALUES ($1, $2, $3, $4, $5)`,
            [email, wallet.address, encryptedKey, verificationToken, true] // Auto-verify for bulk registration
          );

          console.log(`✅ ${email} - Registered with wallet ${wallet.address.slice(0, 10)}... (${user.nft_count} NFTs)`);
        } else {
          console.log(`✅ ${email} - Would be registered (${user.nft_count} NFTs)`);
        }

        registered++;

      } catch (error) {
        console.error(`❌ ${email} - Error: ${error.message}`);
        errors.push({ email, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Bulk Registration Summary');
    console.log('='.repeat(60));
    console.log(`Total users found: ${usersResult.rows.length}`);
    console.log(`Newly registered: ${registered}`);
    console.log(`Already registered: ${skipped}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   ${err.email}: ${err.error}`);
      });
    }

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made');
    } else {
      console.log('\n✅ Bulk registration complete!');
      console.log('\n💡 Next steps:');
      console.log('   1. Run the pre-assignment script: node scripts/pre-assign-nfts.js');
      console.log('   2. Users can now login to the portal with their email');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
bulkRegisterUsers()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

