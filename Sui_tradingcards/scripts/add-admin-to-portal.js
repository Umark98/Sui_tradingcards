/**
 * Quick script to add admin email to portal
 * This adds umarorakzai98@gmail.com to the portal_users table
 */

const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.PGSQL_HOST,
  port: process.env.PGSQL_PORT,
  database: process.env.PGSQL_DATABASE,
  user: process.env.PGSQL_USER,
  password: process.env.PGSQL_PASSWORD,
});

// Admin email
const ADMIN_EMAIL = 'umarorakzai98@gmail.com';

// Simple wallet generation
function generateSimpleWallet() {
  const address = '0x' + crypto.randomBytes(32).toString('hex');
  const privateKey = crypto.randomBytes(32).toString('base64');
  return { address, privateKey };
}

// Simple encryption
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

async function addAdminToPortal() {
  const client = await pool.connect();

  try {
    console.log('🔐 Adding admin email to portal...\n');

    // Check if already exists
    const existing = await client.query(
      'SELECT email, custodial_wallet FROM portal_users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log(`✅ ${ADMIN_EMAIL} already exists in portal!`);
      console.log(`   Wallet: ${existing.rows[0].custodial_wallet}`);
      console.log('\nYou can login at: http://localhost:3000/portal');
      return;
    }

    // Generate wallet
    const wallet = generateSimpleWallet();
    const encryptedKey = encryptPrivateKey(wallet.privateKey);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert
    const result = await client.query(
      `INSERT INTO portal_users (email, custodial_wallet, encrypted_private_key, verification_token, verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING email, custodial_wallet`,
      [ADMIN_EMAIL, wallet.address, encryptedKey, verificationToken, true]
    );

    console.log('✅ Admin email added successfully!');
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Wallet: ${result.rows[0].custodial_wallet}`);
    console.log('\n🎉 You can now login at: http://localhost:3000/portal');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

addAdminToPortal()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

