#!/usr/bin/env node

/**
 * Dry Run Minting Worker
 * 
 * Tests the minting worker WITHOUT actually executing blockchain transactions.
 * Perfect for testing when you have no user wallets connected.
 */

const { Client } = require('pg');

const DB_CONFIG = {
    host: process.env.PGSQL_HOST || 'localhost',
    port: process.env.PGSQL_PORT || 5432,
    database: process.env.PGSQL_DATABASE || 'postgres',
    user: process.env.PGSQL_USER || 'postgres',
    password: process.env.PGSQL_PASSWORD || '',
};

const CONFIG = {
    BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 10,
    DRY_RUN: true
};

class DryRunWorker {
    constructor() {
        this.dbClient = null;
        this.stats = {
            processed: 0,
            wouldSucceed: 0,
            wouldFail: 0
        };
    }

    async initialize() {
        this.dbClient = new Client(DB_CONFIG);
        await this.dbClient.connect();
        console.log('✅ Database connected (DRY RUN MODE)\n');
    }

    async getPendingMints(limit = CONFIG.BATCH_SIZE) {
        const query = `
            SELECT 
                id,
                mint_id,
                card_type,
                level,
                title,
                recipient,
                rarity,
                rank
            FROM minting_records 
            WHERE status = 'pending' 
            ORDER BY created_at ASC
            LIMIT $1
        `;

        const result = await this.dbClient.query(query, [limit]);
        return result.rows;
    }

    async simulateMint(mintRecord) {
        const { mint_id, card_type, level, title, recipient, rarity, rank } = mintRecord;
        
        console.log(`🔍 DRY RUN: Would mint ${card_type}...`);
        console.log(`   Card Type: ${card_type}`);
        console.log(`   Level: ${level}`);
        console.log(`   Title: ${title}`);
        console.log(`   Recipient: ${recipient}`);
        console.log(`   Rarity: ${rarity}`);
        console.log(`   Rank: ${rank || 1}`);
        
        // Simulate Sui transaction
        console.log(`   📝 Would call: mint_card(admin_cap, "${card_type}", ${level}, "${title}", "${recipient}", "${rarity}", ${rank || 1})`);
        
        // Simulate random success/failure for testing
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
            const fakeDigest = `0xdryrun${Math.random().toString(36).substring(2, 15)}`;
            console.log(`   ✅ Would succeed with digest: ${fakeDigest}`);
            this.stats.wouldSucceed++;
            return { success: true, digest: fakeDigest };
        } else {
            console.log(`   ❌ Would fail (simulated error)`);
            this.stats.wouldFail++;
            return { success: false, error: 'Simulated failure' };
        }
    }

    async run() {
        try {
            await this.initialize();
            
            console.log('🧪 DRY RUN MODE - No actual blockchain transactions will be executed\n');
            console.log('📦 Fetching pending mints...\n');
            
            const pendingMints = await this.getPendingMints();
            
            if (pendingMints.length === 0) {
                console.log('⚠️  No pending mints found!');
                console.log('\n💡 Create test mints with:');
                console.log('   node create-test-mints.js create 10');
                return;
            }
            
            console.log(`📊 Found ${pendingMints.length} pending mints\n`);
            console.log('─'.repeat(80) + '\n');
            
            for (const mint of pendingMints) {
                await this.simulateMint(mint);
                console.log('');
                this.stats.processed++;
            }
            
            console.log('─'.repeat(80) + '\n');
            console.log('📊 DRY RUN SUMMARY:');
            console.log(`   Total Processed: ${this.stats.processed}`);
            console.log(`   Would Succeed: ${this.stats.wouldSucceed}`);
            console.log(`   Would Fail: ${this.stats.wouldFail}`);
            console.log('');
            console.log('✅ Dry run completed successfully!');
            console.log('\n💡 To run actual minting:');
            console.log('   npm start');
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            throw error;
        } finally {
            if (this.dbClient) {
                await this.dbClient.end();
            }
        }
    }
}

async function main() {
    const worker = new DryRunWorker();
    await worker.run();
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error:', error.message);
        process.exit(1);
    });
}

module.exports = DryRunWorker;
