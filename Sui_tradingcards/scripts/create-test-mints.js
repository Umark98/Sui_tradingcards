#!/usr/bin/env node

/**
 * Create Test Minting Records
 * 
 * Creates test minting records in the database for testing the minting worker
 * without requiring real user wallets.
 */

const { Client } = require('pg');
const crypto = require('crypto');

const DB_CONFIG = {
    host: process.env.PGSQL_HOST || 'localhost',
    port: process.env.PGSQL_PORT || 5432,
    database: process.env.PGSQL_DATABASE || 'postgres',
    user: process.env.PGSQL_USER || 'postgres',
    password: process.env.PGSQL_PASSWORD || '',
};

// Test wallet addresses (Sui testnet format)
const TEST_WALLETS = [
    '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
];

// Sample Inspector Gadget items
const CARD_TYPES = [
    'Brella', 'Mallet', 'Laser', 'Copter', 'Skates',
    'Arms', 'Legs', 'Hands', 'Ears', 'Eyes'
];

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const LEVELS = [1, 2, 3, 4, 5];

function generateMintId() {
    return crypto.randomBytes(16).toString('hex');
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

async function createTestMints(count = 10) {
    const client = new Client(DB_CONFIG);
    
    try {
        await client.connect();
        console.log('✅ Connected to database');
        
        console.log(`🔨 Creating ${count} test minting records...`);
        
        const records = [];
        
        for (let i = 0; i < count; i++) {
            const cardType = getRandomElement(CARD_TYPES);
            const rarity = getRandomElement(RARITIES);
            const level = getRandomElement(LEVELS);
            const recipient = getRandomElement(TEST_WALLETS);
            
            const record = {
                mint_id: generateMintId(),
                card_type: cardType,
                level: level,
                title: `Inspector Gadget's ${cardType}`,
                recipient: recipient,
                rarity: rarity,
                rank: level,
                status: 'pending'
            };
            
            records.push(record);
        }
        
        // Insert test records
        for (const record of records) {
            const query = `
                INSERT INTO minting_records (
                    mint_id, card_type, level, title, recipient, rarity, rank, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, mint_id
            `;
            
            const values = [
                record.mint_id,
                record.card_type,
                record.level,
                record.title,
                record.recipient,
                record.rarity,
                record.rank,
                record.status
            ];
            
            const result = await client.query(query, values);
            console.log(`✅ Created: ${record.card_type} (${record.rarity}, Level ${record.level}) → ${record.recipient.substring(0, 10)}...`);
        }
        
        console.log(`\n🎉 Successfully created ${count} test minting records!`);
        
        // Show summary
        const summary = await client.query(`
            SELECT 
                card_type,
                rarity,
                COUNT(*) as count
            FROM minting_records
            WHERE status = 'pending'
            GROUP BY card_type, rarity
            ORDER BY card_type, rarity
        `);
        
        console.log('\n📊 Summary of pending mints:');
        summary.rows.forEach(row => {
            console.log(`   ${row.card_type} (${row.rarity}): ${row.count}`);
        });
        
        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

async function clearTestMints() {
    const client = new Client(DB_CONFIG);
    
    try {
        await client.connect();
        
        const result = await client.query(`
            DELETE FROM minting_records 
            WHERE status = 'pending'
            RETURNING id
        `);
        
        console.log(`🗑️  Cleared ${result.rowCount} pending test records`);
        
        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

async function showTestMints() {
    const client = new Client(DB_CONFIG);
    
    try {
        await client.connect();
        
        const result = await client.query(`
            SELECT 
                id,
                mint_id,
                card_type,
                level,
                rarity,
                recipient,
                status,
                transaction_digest,
                error_message
            FROM minting_records
            ORDER BY created_at DESC
            LIMIT 20
        `);
        
        console.log('\n📋 Recent minting records:\n');
        
        result.rows.forEach(row => {
            const status = row.status === 'completed' ? '✅' :
                          row.status === 'failed' ? '❌' : '⏳';
            
            console.log(`${status} ${row.card_type} (${row.rarity}, L${row.level})`);
            console.log(`   Recipient: ${row.recipient.substring(0, 20)}...`);
            console.log(`   Status: ${row.status}`);
            
            if (row.transaction_digest) {
                console.log(`   TX: ${row.transaction_digest.substring(0, 30)}...`);
            }
            
            if (row.error_message) {
                console.log(`   Error: ${row.error_message.substring(0, 50)}...`);
            }
            
            console.log('');
        });
        
        // Show totals
        const totals = await client.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM minting_records
            GROUP BY status
        `);
        
        console.log('📊 Totals by status:');
        totals.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count}`);
        });
        
        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];
const count = parseInt(args[1]) || 10;

async function main() {
    console.log('🧪 Test Minting Records Manager\n');
    
    switch (command) {
        case 'create':
            await createTestMints(count);
            break;
        case 'clear':
            await clearTestMints();
            break;
        case 'show':
            await showTestMints();
            break;
        default:
            console.log('Usage:');
            console.log('  node create-test-mints.js create [count]  - Create test records (default: 10)');
            console.log('  node create-test-mints.js show           - Show existing records');
            console.log('  node create-test-mints.js clear          - Clear pending test records');
            console.log('');
            console.log('Examples:');
            console.log('  node create-test-mints.js create 5   - Create 5 test records');
            console.log('  node create-test-mints.js show       - Show recent records');
            console.log('  node create-test-mints.js clear      - Clear all pending');
            process.exit(0);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error:', error.message);
        process.exit(1);
    });
}

module.exports = { createTestMints, clearTestMints, showTestMints };
