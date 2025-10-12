#!/usr/bin/env node

/**
 * NFT Minting Worker
 * 
 * Processes pending minting records from the database and mints them on Sui blockchain.
 * Handles batch processing, retries, and resume-safe operations.
 */

const { Client } = require('pg');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { TransactionBlock } = require('@mysten/sui/transactions');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');

// Configuration
const CONFIG = {
    BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 100,
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
    RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 5000, // 5 seconds
    POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL) || 10000, // 10 seconds
    SUI_NETWORK: process.env.SUI_NETWORK || 'testnet',
    PACKAGE_ID: process.env.SUI_PACKAGE_ID,
    ADMIN_CAP_ID: process.env.SUI_ADMIN_CAP_ID,
    ADMIN_PRIVATE_KEY: process.env.SUI_ADMIN_PRIVATE_KEY,
};

// Database configuration
const DB_CONFIG = {
    host: process.env.PGSQL_HOST || 'localhost',
    port: process.env.PGSQL_PORT || 5432,
    database: process.env.PGSQL_DATABASE || 'postgres',
    user: process.env.PGSQL_USER || 'postgres',
    password: process.env.PGSQL_PASSWORD || '',
};

class MintingWorker {
    constructor() {
        this.dbClient = null;
        this.suiClient = null;
        this.adminKeypair = null;
        this.stats = {
            totalProcessed: 0,
            completed: 0,
            failed: 0,
            retries: 0,
            startTime: Date.now()
        };
    }

    /**
     * Initialize database and Sui connections
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Minting Worker...');
            
            // Initialize database connection
            this.dbClient = new Client(DB_CONFIG);
            await this.dbClient.connect();
            console.log('✅ Database connected');

            // Initialize Sui client
            const networkUrl = getFullnodeUrl(CONFIG.SUI_NETWORK);
            this.suiClient = new SuiClient({ url: networkUrl });
            console.log(`✅ Sui client connected to ${CONFIG.SUI_NETWORK}`);

            // Initialize admin keypair
            if (!CONFIG.ADMIN_PRIVATE_KEY) {
                throw new Error('SUI_ADMIN_PRIVATE_KEY environment variable is required');
            }
            this.adminKeypair = Ed25519Keypair.fromSecretKey(fromB64(CONFIG.ADMIN_PRIVATE_KEY));
            console.log('✅ Admin keypair loaded');

            // Validate required environment variables
            if (!CONFIG.PACKAGE_ID || !CONFIG.ADMIN_CAP_ID) {
                throw new Error('SUI_PACKAGE_ID and SUI_ADMIN_CAP_ID environment variables are required');
            }

            console.log('🎯 Configuration:');
            console.log(`   Batch Size: ${CONFIG.BATCH_SIZE}`);
            console.log(`   Max Retries: ${CONFIG.MAX_RETRIES}`);
            console.log(`   Package ID: ${CONFIG.PACKAGE_ID}`);
            console.log(`   Admin Cap ID: ${CONFIG.ADMIN_CAP_ID}`);
            console.log('');

        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Get pending minting records from database
     */
    async getPendingMints(limit = CONFIG.BATCH_SIZE) {
        try {
            const query = `
                SELECT 
                    id,
                    mint_id,
                    card_type,
                    level,
                    title,
                    recipient,
                    rarity,
                    rank,
                    retry_count
                FROM minting_records 
                WHERE status = 'pending' 
                ORDER BY 
                    retry_count ASC,
                    created_at ASC
                LIMIT $1
            `;

            const result = await this.dbClient.query(query, [limit]);
            return result.rows;
        } catch (error) {
            console.error('❌ Error fetching pending mints:', error.message);
            throw error;
        }
    }

    /**
     * Process a single mint job
     */
    async processMintJob(mintRecord) {
        const { id, mint_id, card_type, level, title, recipient, rarity, rank } = mintRecord;
        
        try {
            console.log(`🔄 Processing mint ${mint_id} for ${recipient}...`);

            // Create transaction block
            const txb = new TransactionBlock();

            // Call the mint function on your Sui contract
            // Adjust this based on your actual contract function signature
            txb.moveCall({
                target: `${CONFIG.PACKAGE_ID}::tradingcard::mint_card`,
                arguments: [
                    txb.object(CONFIG.ADMIN_CAP_ID), // admin cap
                    txb.pure.string(card_type),      // card type
                    txb.pure.u64(level),             // level
                    txb.pure.string(title),          // title
                    txb.pure.string(recipient),      // recipient
                    txb.pure.string(rarity),         // rarity
                    txb.pure.u64(rank || 1),         // rank
                ],
            });

            // Set gas budget
            txb.setGasBudget(10000000);

            // Sign and execute transaction
            const result = await this.suiClient.signAndExecuteTransactionBlock({
                transactionBlock: txb,
                signer: this.adminKeypair,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                },
            });

            if (result.effects?.status?.status === 'success') {
                const transactionDigest = result.digest;
                console.log(`✅ Mint successful: ${transactionDigest}`);
                
                await this.updateMintRecord(id, 'completed', transactionDigest);
                this.stats.completed++;
                return { success: true, transactionDigest };
            } else {
                throw new Error(`Transaction failed: ${JSON.stringify(result.effects?.status)}`);
            }

        } catch (error) {
            console.error(`❌ Mint failed for ${mint_id}:`, error.message);
            
            // Increment retry count
            const newRetryCount = (mintRecord.retry_count || 0) + 1;
            
            if (newRetryCount >= CONFIG.MAX_RETRIES) {
                await this.updateMintRecord(id, 'failed', null, error.message);
                this.stats.failed++;
            } else {
                await this.updateMintRecord(id, 'pending', null, error.message, newRetryCount);
                this.stats.retries++;
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Update mint record in database
     */
    async updateMintRecord(id, status, transactionDigest = null, errorMessage = null, retryCount = null) {
        try {
            let query, params;

            if (status === 'completed') {
                query = `
                    UPDATE minting_records 
                    SET status = $1, 
                        transaction_digest = $2, 
                        completed_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `;
                params = [status, transactionDigest, id];
            } else if (status === 'failed') {
                query = `
                    UPDATE minting_records 
                    SET status = $1, 
                        error_message = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `;
                params = [status, errorMessage, id];
            } else if (status === 'pending' && retryCount !== null) {
                query = `
                    UPDATE minting_records 
                    SET retry_count = $1,
                        error_message = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `;
                params = [retryCount, errorMessage, id];
            }

            await this.dbClient.query(query, params);
        } catch (error) {
            console.error('❌ Error updating mint record:', error.message);
            throw error;
        }
    }

    /**
     * Process a batch of minting jobs
     */
    async processBatch() {
        try {
            const pendingMints = await this.getPendingMints();
            
            if (pendingMints.length === 0) {
                return { hasMore: false, processed: 0 };
            }

            console.log(`📦 Processing batch of ${pendingMints.length} mints...`);

            // Process mints in parallel (with concurrency limit)
            const concurrencyLimit = 10;
            const results = [];
            
            for (let i = 0; i < pendingMints.length; i += concurrencyLimit) {
                const batch = pendingMints.slice(i, i + concurrencyLimit);
                const batchPromises = batch.map(mintRecord => this.processMintJob(mintRecord));
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);
            }

            this.stats.totalProcessed += pendingMints.length;
            
            return { 
                hasMore: pendingMints.length === CONFIG.BATCH_SIZE, 
                processed: pendingMints.length 
            };

        } catch (error) {
            console.error('❌ Error processing batch:', error.message);
            throw error;
        }
    }

    /**
     * Get current statistics
     */
    async getStats() {
        try {
            const query = `
                SELECT 
                    status,
                    COUNT(*) as count
                FROM minting_records 
                GROUP BY status
            `;
            
            const result = await this.dbClient.query(query);
            const stats = {};
            
            result.rows.forEach(row => {
                stats[row.status] = parseInt(row.count);
            });

            return stats;
        } catch (error) {
            console.error('❌ Error getting stats:', error.message);
            return {};
        }
    }

    /**
     * Log current progress
     */
    async logProgress() {
        const dbStats = await this.getStats();
        const runtime = Math.round((Date.now() - this.stats.startTime) / 1000);
        
        console.log('\n📊 Progress Report:');
        console.log(`   Runtime: ${runtime}s`);
        console.log(`   Processed: ${this.stats.totalProcessed}`);
        console.log(`   Completed: ${this.stats.completed}`);
        console.log(`   Failed: ${this.stats.failed}`);
        console.log(`   Retries: ${this.stats.retries}`);
        console.log(`   Database Stats:`);
        console.log(`     Pending: ${dbStats.pending || 0}`);
        console.log(`     Completed: ${dbStats.completed || 0}`);
        console.log(`     Failed: ${dbStats.failed || 0}`);
        console.log('');
    }

    /**
     * Main worker loop
     */
    async run() {
        try {
            await this.initialize();
            
            console.log('🔄 Starting minting worker loop...\n');
            
            let hasMore = true;
            let consecutiveEmptyBatches = 0;
            
            while (hasMore) {
                const result = await this.processBatch();
                
                if (result.processed === 0) {
                    consecutiveEmptyBatches++;
                    if (consecutiveEmptyBatches >= 3) {
                        console.log('✅ No more pending mints found. Worker completed.');
                        break;
                    }
                } else {
                    consecutiveEmptyBatches = 0;
                }
                
                hasMore = result.hasMore;
                
                // Log progress every batch
                await this.logProgress();
                
                // Wait before next batch if there are more
                if (hasMore) {
                    console.log(`⏳ Waiting ${CONFIG.POLL_INTERVAL}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL));
                }
            }
            
            console.log('🎉 Minting worker completed successfully!');
            await this.logProgress();
            
        } catch (error) {
            console.error('💥 Fatal error in minting worker:', error.message);
            throw error;
        } finally {
            if (this.dbClient) {
                await this.dbClient.end();
                console.log('🔌 Database connection closed');
            }
        }
    }

    /**
     * Handle graceful shutdown
     */
    async shutdown() {
        console.log('\n🛑 Shutting down minting worker...');
        await this.logProgress();
        
        if (this.dbClient) {
            await this.dbClient.end();
        }
        
        process.exit(0);
    }
}

// Main execution
async function main() {
    const worker = new MintingWorker();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => worker.shutdown());
    process.on('SIGTERM', () => worker.shutdown());
    
    try {
        await worker.run();
    } catch (error) {
        console.error('💥 Worker failed:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = MintingWorker;
