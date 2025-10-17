/**
 * Update Legacy User Wallet Script
 * 
 * This script updates the wallet address in the legacy users table to match
 * the new custodial wallet from the portal_users table.
 * 
 * Usage: node scripts/update-legacy-user-wallet.js <email>
 */

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.PGSQL_HOST || 'localhost',
  port: Number(process.env.PGSQL_PORT) || 5432,
  database: process.env.PGSQL_DATABASE || 'tradingdb',
  user: process.env.PGSQL_USER || 'postgres',
  password: process.env.PGSQL_PASSWORD || '',
  options: '-c search_path=public'
});

async function updateLegacyUserWallet(email) {
  const client = await pool.connect();

  try {
    console.log(`🔍 Looking up user: ${email}`);
    
    // Get the new wallet from portal_users table
    const portalUserResult = await client.query(
      'SELECT custodial_wallet, encrypted_private_key FROM portal_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (portalUserResult.rows.length === 0) {
      console.log(`❌ User ${email} not found in portal_users table`);
      return;
    }

    const portalUser = portalUserResult.rows[0];
    console.log(`📋 Portal user record:`);
    console.log(`   Email: ${email}`);
    console.log(`   New Wallet: ${portalUser.custodial_wallet}`);

    // Get current legacy user record
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
    console.log(`   Old Private Key: ${legacyUser.wallet_private_key}`);
    console.log(`   Old Mnemonic: ${legacyUser.wallet_mnemonic}`);

    // Update the legacy users table with new wallet information
    console.log(`\n💾 Updating legacy users table...`);
    const updateResult = await client.query(
      `UPDATE users 
       SET wallet_address = $1, 
           wallet_private_key = $2,
           wallet_mnemonic = $3,
           wallet_created_at = CURRENT_TIMESTAMP
       WHERE user_email = $4
       RETURNING user_id, user_email, wallet_address, wallet_created_at`,
      [
        portalUser.custodial_wallet,  // New wallet address
        portalUser.encrypted_private_key, // New encrypted private key
        'Migrated from portal system', // New mnemonic (placeholder)
        email.toLowerCase()
      ]
    );

    if (updateResult.rows.length > 0) {
      const updatedUser = updateResult.rows[0];
      console.log(`✅ Legacy user wallet updated successfully!`);
      console.log(`   User ID: ${updatedUser.user_id}`);
      console.log(`   Email: ${updatedUser.user_email}`);
      console.log(`   New Wallet: ${updatedUser.wallet_address}`);
      console.log(`   Updated: ${updatedUser.wallet_created_at}`);

      // Log the activity
      await client.query(
        `INSERT INTO user_activity_log (email, activity_type, activity_data)
         VALUES ($1, $2, $3)`,
        [email.toLowerCase(), 'legacy_wallet_updated', { 
          legacyUserId: legacyUser.user_id,
          oldWallet: legacyUser.wallet_address,
          newWallet: portalUser.custodial_wallet,
          timestamp: new Date().toISOString()
        }]
      );

      console.log(`\n📝 Activity logged in user_activity_log table`);

      // Show update summary
      console.log(`\n📊 UPDATE SUMMARY:`);
      console.log(`   ✅ Legacy users table updated with new wallet`);
      console.log(`   ✅ Portal and legacy systems now synchronized`);
      console.log(`   ✅ Old wallet: ${legacyUser.wallet_address}`);
      console.log(`   ✅ New wallet: ${portalUser.custodial_wallet}`);
      console.log(`   ✅ User will now see the correct wallet in portal`);

    } else {
      console.log(`❌ Failed to update legacy user record`);
    }

  } catch (error) {
    console.error(`❌ Error updating legacy user wallet:`, error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Main execution
const email = process.argv[2];

if (!email) {
  console.log('❌ Usage: node scripts/update-legacy-user-wallet.js <email>');
  console.log('   Example: node scripts/update-legacy-user-wallet.js mohammediblal@hotmail.com');
  process.exit(1);
}

updateLegacyUserWallet(email)
  .then(() => {
    console.log('\n✨ Legacy wallet update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
