import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: Request) {
    console.log('Simple Collections API called');
    
    try {
        console.log('Attempting to connect to database...');
        const client = await pool.connect();
        console.log('Database connection successful');
        
        try {
            // Get query parameters
            const url = new URL(request.url);
            const collectionName = url.searchParams.get('collection');
            
            console.log('Query parameters:', { collectionName });
            
            if (!collectionName) {
                console.log('Error: Collection name is required');
                return NextResponse.json(
                    { success: false, error: 'Collection name is required' },
                    { status: 400 }
                );
            }

            // Simple query to test basic functionality
            console.log('Executing simple collections query...');
            const simpleQuery = `
                SELECT 
                    c.name as collection_name,
                    COUNT(n.nft_id) as nft_count,
                    COUNT(DISTINCT u.user_id) as user_count
                FROM collections c
                LEFT JOIN nfts n ON c.collection_id = n.collection_id
                LEFT JOIN users u ON n.user_id = u.user_id
                WHERE c.name = $1
                GROUP BY c.name
            `;
            
            const result = await client.query(simpleQuery, [collectionName]);
            console.log('Simple query result:', result.rows);

            if (result.rows.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: `Collection '${collectionName}' not found`,
                    collectionName,
                    stats: {
                        totalUsers: 0,
                        totalNfts: 0,
                        uniqueTypes: 0,
                        uniqueRarities: 0
                    },
                    distribution: [],
                    topUsers: [],
                    collectionUsers: [],
                    totalResults: 0
                });
            }

            const collectionData = result.rows[0];
            
            // Get a few sample users from this collection
            const sampleQuery = `
                SELECT DISTINCT
                    u.user_id,
                    u.user_email,
                    n.nft_title,
                    n.nft_serial_number,
                    nt.type_name,
                    nr.rarity_name
                FROM users u
                JOIN nfts n ON u.user_id = n.user_id
                JOIN collections c ON n.collection_id = c.collection_id
                LEFT JOIN nft_types nt ON n.type_id = nt.type_id
                LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
                WHERE c.name = $1
                LIMIT 10
            `;
            
            const sampleResult = await client.query(sampleQuery, [collectionName]);
            console.log('Sample query result:', sampleResult.rows.length, 'rows');

            const collectionUsers = sampleResult.rows.map((row: any) => ({
                userId: row.user_id,
                userEmail: row.user_email,
                nftTitle: row.nft_title,
                nftDescription: '',
                nftSerialNumber: row.nft_serial_number,
                numEntities: 0,
                type: '',
                rarity: row.rarity_name || '',
                mintedLevel: 0,
                editionSize: 0,
                typeName: row.type_name || '',
                rarityName: row.rarity_name || '',
                levelValue: 0,
                collectionName: collectionData.collection_name,
                collectionSeries: '',
                artistName: '',
                artistCopyright: '',
                platformName: ''
            }));

            return NextResponse.json({
                success: true,
                message: `Found collection '${collectionName}'`,
                collectionName,
                stats: {
                    totalUsers: parseInt(collectionData.user_count) || 0,
                    totalNfts: parseInt(collectionData.nft_count) || 0,
                    uniqueTypes: 0, // Simplified for now
                    uniqueRarities: 0 // Simplified for now
                },
                distribution: [],
                topUsers: [],
                collectionUsers,
                totalResults: collectionUsers.length
            });

        } finally {
            console.log('Releasing database connection');
            client.release();
        }

    } catch (error: any) {
        console.error('Error in simple collections API:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to fetch collection data', 
                details: error.message,
                stack: error.stack
            }, 
            { status: 500 }
        );
    }
}
