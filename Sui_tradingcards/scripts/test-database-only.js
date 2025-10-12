#!/usr/bin/env node

/**
 * Database-Only Test
 * 
 * Tests just the database connection and setup without requiring Sui configuration.
 * Perfect for initial testing when you don't have Sui setup yet.
 */

const { Client } = require('pg');

const DB_CONFIG = {
    host: process.env.PGSQL_HOST || 'localhost',
    port: process.env.PGSQL_PORT || 5432,
    database: process.env.PGSQL_DATABASE || 'postgres',
    user: process.env.PGSQL_USER || 'postgres',
    password: process.env.PGSQL_PASSWORD || '',
};

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    console.log(`   Host: ${DB_CONFIG.host}`);
    console.log(`   Port: ${DB_CONFIG.port}`);
    console.log(`   Database: ${DB_CONFIG.database}`);
    console.log(`   User: ${DB_CONFIG.user}`);
    console.log('');
    
    const client = new Client(DB_CONFIG);
    
    try {
        await client.connect();
        console.log('✅ Database connection successful');
        
        // Test minting_records table
        const result = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
            FROM minting_records
        `);
        
        const stats = result.rows[0];
        console.log('📊 Database stats:');
        console.log(`   Total records: ${stats.total}`);
        console.log(`   Pending: ${stats.pending}`);
        console.log(`   Completed: ${stats.completed}`);
        console.log(`   Failed: ${stats.failed}`);
        
        // Check required columns
        const columnsResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'minting_records'
            AND column_name IN ('retry_count', 'error_message', 'updated_at')
        `);
        
        const requiredColumns = ['retry_count', 'error_message', 'updated_at'];
        const existingColumns = columnsResult.rows.map(row => row.column_name);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length > 0) {
            console.log('⚠️  Missing required columns:', missingColumns.join(', '));
            console.log('   Run: psql -d postgres -f migrate-database.sql');
        } else {
            console.log('✅ All required columns present');
        }
        
        await client.end();
        return true;
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        await client.end();
        return false;
    }
}

async function createTestMints(count = 5) {
    console.log(`🔨 Creating ${count} test minting records...`);
    
    const client = new Client(DB_CONFIG);
    
    try {
        await client.connect();
        
        // Sample test data
        const testData = [
            { card_type: 'Brella', level: 1, rarity: 'Common', rank: 1 },
            { card_type: 'Mallet', level: 2, rarity: 'Uncommon', rank: 2 },
            { card_type: 'Laser', level: 3, rarity: 'Rare', rank: 3 },
            { card_type: 'Copter', level: 4, rarity: 'Epic', rank: 4 },
            { card_type: 'Skates', level: 5, rarity: 'Legendary', rank: 5 }
        ];
        
        for (let i = 0; i < Math.min(count, testData.length); i++) {
            const data = testData[i];
            const mintId = `test_${Date.now()}_${i}`;
            const recipient = `0xtest${i.toString().padStart(40, '0')}`;
            
            const query = `
                INSERT INTO minting_records (
                    mint_id, card_type, level, title, recipient, rarity, rank, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, mint_id
            `;
            
            const values = [
                mintId,
                data.card_type,
                data.level,
                `Inspector Gadget's ${data.card_type}`,
                recipient,
                data.rarity,
                data.rank,
                'pending'
            ];
            
            const result = await client.query(query, values);
            console.log(`✅ Created: ${data.card_type} (${data.rarity}, Level ${data.level})`);
        }
        
        console.log(`\n🎉 Successfully created ${Math.min(count, testData.length)} test records!`);
        
        await client.end();
        return true;
        
    } catch (error) {
        console.error('❌ Error creating test mints:', error.message);
        await client.end();
        return false;
    }
}

async function showMints() {
    console.log('📋 Current minting records:\n');
    
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
                created_at
            FROM minting_records
            ORDER BY created_at DESC
            LIMIT 10
        `);
        
        if (result.rows.length === 0) {
            console.log('No minting records found.');
            console.log('\n💡 Create test records with:');
            console.log('   node test-database-only.js create');
            return;
        }
        
        result.rows.forEach(row => {
            const status = row.status === 'completed' ? '✅' :
                          row.status === 'failed' ? '❌' : '⏳';
            
            console.log(`${status} ${row.card_type} (${row.rarity}, L${row.level})`);
            console.log(`   ID: ${row.id} | Recipient: ${row.recipient.substring(0, 20)}...`);
            console.log(`   Status: ${row.status} | Created: ${row.created_at}`);
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
    }
}

async function clearTestMints() {
    console.log('🗑️  Clearing test minting records...');
    
    const client = new Client(DB_CONFIG);
    
    try {
        await client.connect();
        
        const result = await client.query(`
            DELETE FROM minting_records 
            WHERE mint_id LIKE 'test_%'
            RETURNING id
        `);
        
        console.log(`✅ Cleared ${result.rowCount} test records`);
        
        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    console.log('🧪 Database-Only Test\n');
    
    switch (command) {
        case 'create':
            await createTestMints(5);
            break;
        case 'show':
            await showMints();
            break;
        case 'clear':
            await clearTestMints();
            break;
        default:
            await testDatabaseConnection();
            console.log('\n💡 Available commands:');
            console.log('   node test-database-only.js create  - Create 5 test records');
            console.log('   node test-database-only.js show    - Show existing records');
            console.log('   node test-database-only.js clear   - Clear test records');
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error:', error.message);
        process.exit(1);
    });
}

module.exports = { testDatabaseConnection, createTestMints, showMints, clearTestMints };
