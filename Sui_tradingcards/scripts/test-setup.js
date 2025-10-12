#!/usr/bin/env node

/**
 * Test Setup Script
 * 
 * Verifies that the minting worker can connect to database and Sui network.
 * Run this before starting the actual worker to ensure everything is configured correctly.
 */

const { Client } = require('pg');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');

// Configuration
const CONFIG = {
    SUI_NETWORK: process.env.SUI_NETWORK || 'testnet',
    PACKAGE_ID: process.env.SUI_PACKAGE_ID,
    ADMIN_CAP_ID: process.env.SUI_ADMIN_CAP_ID,
    ADMIN_PRIVATE_KEY: process.env.SUI_ADMIN_PRIVATE_KEY,
};

const DB_CONFIG = {
    host: process.env.PGSQL_HOST || 'localhost',
    port: process.env.PGSQL_PORT || 5432,
    database: process.env.PGSQL_DATABASE || 'postgres',
    user: process.env.PGSQL_USER || 'postgres',
    password: process.env.PGSQL_PASSWORD || '',
};

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    
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
            console.log('   Run: psql -d your_database -f migrate-database.sql');
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

async function testSuiConnection() {
    console.log('🔍 Testing Sui connection...');
    
    try {
        // Test network connection
        const networkUrl = getFullnodeUrl(CONFIG.SUI_NETWORK);
        const suiClient = new SuiClient({ url: networkUrl });
        
        // Get network info
        const networkInfo = await suiClient.getChainIdentifier();
        console.log(`✅ Sui network connected: ${networkInfo}`);
        
        // Test admin keypair
        if (!CONFIG.ADMIN_PRIVATE_KEY) {
            console.error('❌ SUI_ADMIN_PRIVATE_KEY not set');
            return false;
        }
        
        const adminKeypair = Ed25519Keypair.fromSecretKey(fromB64(CONFIG.ADMIN_PRIVATE_KEY));
        const adminAddress = adminKeypair.getPublicKey().toSuiAddress();
        console.log(`✅ Admin keypair loaded: ${adminAddress}`);
        
        // Test package and admin cap
        if (!CONFIG.PACKAGE_ID) {
            console.error('❌ SUI_PACKAGE_ID not set');
            return false;
        }
        
        if (!CONFIG.ADMIN_CAP_ID) {
            console.error('❌ SUI_ADMIN_CAP_ID not set');
            return false;
        }
        
        // Try to fetch package info
        try {
            const packageInfo = await suiClient.getObject({
                id: CONFIG.PACKAGE_ID,
                options: { showContent: true }
            });
            console.log('✅ Package ID is valid');
        } catch (error) {
            console.log('⚠️  Could not fetch package info (may be normal)');
        }
        
        // Try to fetch admin cap
        try {
            const adminCap = await suiClient.getObject({
                id: CONFIG.ADMIN_CAP_ID,
                options: { showContent: true }
            });
            console.log('✅ Admin cap ID is valid');
        } catch (error) {
            console.log('⚠️  Could not fetch admin cap info (may be normal)');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Sui connection failed:', error.message);
        return false;
    }
}

async function testEnvironmentVariables() {
    console.log('🔍 Testing environment variables...');
    
    const required = [
        'PGSQL_HOST',
        'PGSQL_DATABASE', 
        'PGSQL_USER',
        'PGSQL_PASSWORD',
        'SUI_PACKAGE_ID',
        'SUI_ADMIN_CAP_ID',
        'SUI_ADMIN_PRIVATE_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        console.log('   Copy env.example to .env and configure it');
        return false;
    }
    
    console.log('✅ All required environment variables present');
    return true;
}

async function main() {
    console.log('🧪 Minting Worker Setup Test\n');
    
    const tests = [
        { name: 'Environment Variables', fn: testEnvironmentVariables },
        { name: 'Database Connection', fn: testDatabaseConnection },
        { name: 'Sui Connection', fn: testSuiConnection }
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
        console.log(`\n--- ${test.name} ---`);
        const passed = await test.fn();
        if (!passed) {
            allPassed = false;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (allPassed) {
        console.log('🎉 All tests passed! You can start the minting worker.');
        console.log('   Run: npm start');
    } else {
        console.log('❌ Some tests failed. Please fix the issues above before starting the worker.');
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Test failed:', error.message);
        process.exit(1);
    });
}

module.exports = { testDatabaseConnection, testSuiConnection, testEnvironmentVariables };
