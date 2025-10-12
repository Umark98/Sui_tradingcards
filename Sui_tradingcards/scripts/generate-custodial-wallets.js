const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { Pool } = require('pg');
const crypto = require('crypto');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tradingdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Function to generate a unique Ed25519 wallet
function generateWallet() {
  const keypair = new Ed25519Keypair();
  const address = keypair.toSuiAddress();
  
  // Export the keypair to get the private key
  const exported = keypair.export();
  const privateKey = exported.privateKey;
  
  return {
    address,
    privateKey,
    keypair
  };
}

// Function to generate a mnemonic (24 words)
function generateMnemonic() {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
    'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
    'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
    'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
    'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
    'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
    'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
    'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
    'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
    'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
    'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact',
    'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
    'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
    'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
    'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis'
  ];
  
  // Generate 24 random words
  const mnemonic = [];
  for (let i = 0; i < 24; i++) {
    const randomIndex = crypto.randomInt(0, words.length);
    mnemonic.push(words[randomIndex]);
  }
  
  return mnemonic.join(' ');
}

// Main function to generate wallets for all users
async function generateWalletsForAllUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting custodial wallet generation for all users...\n');
    
    // Get all users without wallets
    const usersResult = await client.query(`
      SELECT user_id, user_email 
      FROM users 
      WHERE wallet_address IS NULL
      ORDER BY user_id
    `);
    
    const totalUsers = usersResult.rows.length;
    console.log(`📊 Found ${totalUsers} users without wallets\n`);
    
    if (totalUsers === 0) {
      console.log('✅ All users already have wallets!');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();
    const batchSize = 100;
    
    // Process in batches
    for (let i = 0; i < usersResult.rows.length; i += batchSize) {
      const batch = usersResult.rows.slice(i, i + batchSize);
      
      await client.query('BEGIN');
      
      try {
        for (const user of batch) {
          let retries = 0;
          let success = false;
          
          while (retries < 3 && !success) {
            try {
              // Generate wallet
              const wallet = generateWallet();
              const mnemonic = generateMnemonic();
              
              // Update user with wallet info
              await client.query(`
                UPDATE users 
                SET wallet_address = $1,
                    wallet_private_key = $2,
                    wallet_mnemonic = $3,
                    wallet_created_at = CURRENT_TIMESTAMP
                WHERE user_id = $4
              `, [wallet.address, wallet.privateKey, mnemonic, user.user_id]);
              
              successCount++;
              success = true;
              
              // Progress indicator
              if (successCount % 100 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                const rate = (successCount / elapsed).toFixed(2);
                const remaining = totalUsers - successCount;
                const eta = (remaining / rate).toFixed(0);
                
                console.log(`✓ Progress: ${successCount}/${totalUsers} (${((successCount/totalUsers)*100).toFixed(2)}%)`);
                console.log(`  Rate: ${rate} wallets/sec | ETA: ${eta}s | Errors: ${errorCount}\n`);
              }
              
            } catch (err) {
              retries++;
              if (retries === 3) {
                console.error(`❌ Failed to create wallet for user ${user.user_id} (${user.user_email}):`, err.message);
                errorCount++;
              }
            }
          }
        }
        
        await client.query('COMMIT');
        
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Batch error:`, err.message);
        errorCount += batch.length;
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Wallet Generation Complete!\n');
    console.log(`✅ Successfully created: ${successCount} wallets`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏱️  Total time: ${totalTime}s`);
    console.log(`📈 Average rate: ${(successCount / totalTime).toFixed(2)} wallets/sec`);
    console.log('='.repeat(60) + '\n');
    
    // Verify uniqueness
    console.log('🔍 Verifying wallet uniqueness...');
    const uniqueCheck = await client.query(`
      SELECT 
        COUNT(*) as total_wallets,
        COUNT(DISTINCT wallet_address) as unique_addresses
      FROM users
      WHERE wallet_address IS NOT NULL
    `);
    
    const stats = uniqueCheck.rows[0];
    console.log(`✓ Total wallets: ${stats.total_wallets}`);
    console.log(`✓ Unique addresses: ${stats.unique_addresses}`);
    
    if (stats.total_wallets === stats.unique_addresses) {
      console.log('✅ All wallet addresses are unique!\n');
    } else {
      console.log('⚠️  Warning: Found duplicate addresses!\n');
    }
    
    // Show sample wallets
    console.log('📋 Sample wallets (first 5):');
    const sampleResult = await client.query(`
      SELECT user_id, user_email, wallet_address, wallet_created_at
      FROM users
      WHERE wallet_address IS NOT NULL
      ORDER BY user_id
      LIMIT 5
    `);
    
    console.table(sampleResult.rows);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
console.log('🔐 Sui Custodial Wallet Generator (Ed25519)\n');
console.log('⚠️  This will generate wallets for all users without one.');
console.log('   Each wallet will have a unique address, private key, and mnemonic.\n');

generateWalletsForAllUsers()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });

