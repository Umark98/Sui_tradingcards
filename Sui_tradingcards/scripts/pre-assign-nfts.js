/**
 * Pre-Assignment Script
 * 
 * This script analyzes the legacy NFT database and creates reservations
 * for users based on their previous NFT titles and collections.
 * 
 * Usage: node scripts/pre-assign-nfts.js [--dry-run] [--email=user@example.com]
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGSQL_HOST,
  port: process.env.PGSQL_PORT,
  database: process.env.PGSQL_DATABASE,
  user: process.env.PGSQL_USER,
  password: process.env.PGSQL_PASSWORD,
});

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const emailFilter = args.find(arg => arg.startsWith('--email='))?.split('=')[1];

async function preAssignNFTs() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting NFT Pre-Assignment Process...\n');
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
    if (emailFilter) {
      console.log(`Filter: Only processing ${emailFilter}\n`);
    }

    // Step 1: Get all users with their NFTs from legacy database
    console.log('📊 Fetching legacy NFT data...');
    
    let userQuery = `
      SELECT 
        u.user_email,
        COUNT(DISTINCT n.nft_id) as total_nfts,
        json_agg(
          json_build_object(
            'nft_id', n.nft_id,
            'nft_title', n.nft_title,
            'nft_description', n.nft_description,
            'type', nt.type_name,
            'rarity', nr.rarity_name,
            'level', nml.level_value,
            'collection', c.name,
            'serial_number', n.nft_serial_number,
            'edition_size', n.edition_size
          )
        ) as nfts
      FROM users u
      JOIN nfts n ON u.user_id = n.user_id
      LEFT JOIN nft_types nt ON n.type_id = nt.type_id
      LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
      LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
      LEFT JOIN collections c ON n.collection_id = c.collection_id
      WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
    `;

    if (emailFilter) {
      userQuery += ` AND u.user_email = $1`;
    }

    userQuery += ` GROUP BY u.user_email ORDER BY total_nfts DESC`;

    const usersResult = await client.query(
      userQuery,
      emailFilter ? [emailFilter] : []
    );

    console.log(`✓ Found ${usersResult.rows.length} users with NFTs\n`);

    let totalReservations = 0;
    let usersProcessed = 0;
    let usersSkipped = 0;
    let errors = [];

    // Step 2: Process each user
    for (const userRow of usersResult.rows) {
      const email = userRow.user_email;
      const nfts = userRow.nfts;

      try {
        console.log(`\n👤 Processing: ${email} (${nfts.length} NFTs)`);

        // Check if user exists in portal_users
        const portalUserCheck = await client.query(
          'SELECT email FROM portal_users WHERE email = $1',
          [email.toLowerCase()]
        );

        if (portalUserCheck.rows.length === 0) {
          console.log(`   ⚠️  User not registered in portal - skipping`);
          usersSkipped++;
          continue;
        }

        // Check if user already has reservations
        const existingReservations = await client.query(
          'SELECT COUNT(*) as count FROM nft_reservations WHERE email = $1',
          [email.toLowerCase()]
        );

        if (parseInt(existingReservations.rows[0].count) > 0) {
          console.log(`   ℹ️  User already has ${existingReservations.rows[0].count} reservations - skipping`);
          usersSkipped++;
          continue;
        }

        // Create reservations for each NFT
        let userReservationCount = 0;

        for (const nft of nfts) {
          if (!nft.nft_title) continue;

          // Build metadata URI (placeholder - update with your actual metadata)
          const metadataUri = `ipfs://metadata/${nft.nft_title.replace(/\s+/g, '-').toLowerCase()}`;
          
          // Build image URL (placeholder - update with your actual images)
          const imageUrl = `https://example.com/nft-images/${nft.nft_title.replace(/\s+/g, '-').toLowerCase()}.png`;

          if (!isDryRun) {
            await client.query(
              `INSERT INTO nft_reservations (
                email, nft_title, nft_type, rarity, level, 
                collection_name, description, metadata_uri, image_url, 
                original_nft_id, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                email.toLowerCase(),
                nft.nft_title,
                nft.type || 'Unknown',
                nft.rarity || 'Common',
                nft.level || 1,
                nft.collection || 'Legacy Collection',
                nft.nft_description || `${nft.nft_title} from legacy collection`,
                metadataUri,
                imageUrl,
                nft.nft_id,
                'reserved'
              ]
            );
          }

          userReservationCount++;
        }

        console.log(`   ✓ Created ${userReservationCount} reservations`);
        totalReservations += userReservationCount;
        usersProcessed++;

      } catch (error) {
        console.error(`   ❌ Error processing ${email}:`, error.message);
        errors.push({ email, error: error.message });
      }
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Pre-Assignment Summary');
    console.log('='.repeat(60));
    console.log(`Total users found: ${usersResult.rows.length}`);
    console.log(`Users processed: ${usersProcessed}`);
    console.log(`Users skipped: ${usersSkipped}`);
    console.log(`Total reservations created: ${totalReservations}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   ${err.email}: ${err.error}`);
      });
    }

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
    } else {
      console.log('\n✅ Pre-assignment complete!');
    }

    // Step 4: Statistics by collection
    if (!isDryRun && totalReservations > 0) {
      console.log('\n📈 Reservations by Collection:');
      const statsResult = await client.query(`
        SELECT 
          collection_name,
          COUNT(*) as count,
          COUNT(DISTINCT email) as unique_users
        FROM nft_reservations
        GROUP BY collection_name
        ORDER BY count DESC
      `);

      statsResult.rows.forEach(row => {
        console.log(`   ${row.collection_name}: ${row.count} NFTs (${row.unique_users} users)`);
      });

      console.log('\n📈 Reservations by Rarity:');
      const rarityResult = await client.query(`
        SELECT 
          rarity,
          COUNT(*) as count
        FROM nft_reservations
        GROUP BY rarity
        ORDER BY 
          CASE rarity
            WHEN 'Legendary' THEN 1
            WHEN 'Epic' THEN 2
            WHEN 'Rare' THEN 3
            WHEN 'Uncommon' THEN 4
            WHEN 'Common' THEN 5
            ELSE 6
          END
      `);

      rarityResult.rows.forEach(row => {
        console.log(`   ${row.rarity}: ${row.count}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function showHelp() {
  console.log(`
NFT Pre-Assignment Script
=========================

This script creates NFT reservations for users based on their legacy NFTs.

Usage:
  node scripts/pre-assign-nfts.js [options]

Options:
  --dry-run              Run without making changes (preview mode)
  --email=user@email.com Process only specific user
  --help                 Show this help message

Examples:
  # Preview what would be assigned
  node scripts/pre-assign-nfts.js --dry-run

  # Assign NFTs for all users
  node scripts/pre-assign-nfts.js

  # Assign NFTs for specific user
  node scripts/pre-assign-nfts.js --email=user@example.com

Notes:
  - Users must be registered in portal_users table first
  - Existing reservations will not be overwritten
  - Each legacy NFT creates one reservation
  `);
}

// Main execution
if (args.includes('--help')) {
  showHelp();
  process.exit(0);
}

preAssignNFTs()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

