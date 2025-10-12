import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: Request) {
    try {
        const client = await pool.connect();
        
        try {
            // Get all collections in the database
            const collectionsQuery = `
                SELECT 
                    c.name as collection_name,
                    COUNT(n.nft_id) as nft_count,
                    COUNT(DISTINCT u.user_id) as user_count
                FROM collections c
                LEFT JOIN nfts n ON c.collection_id = n.collection_id
                LEFT JOIN users u ON n.user_id = u.user_id
                GROUP BY c.name, c.collection_id
                ORDER BY nft_count DESC
            `;

            const result = await client.query(collectionsQuery);

            // Also check if specific collections exist
            const specificCollections = ['Genesis', 'Missions', 'Moments', 'Gadgets', 'Tickets'];
            const collectionChecks = [];

            for (const collectionName of specificCollections) {
                const checkQuery = `
                    SELECT 
                        c.name,
                        COUNT(n.nft_id) as nft_count,
                        COUNT(DISTINCT u.user_id) as user_count
                    FROM collections c
                    LEFT JOIN nfts n ON c.collection_id = n.collection_id
                    LEFT JOIN users u ON n.user_id = u.user_id
                    WHERE c.name = $1
                    GROUP BY c.name
                `;
                
                const checkResult = await client.query(checkQuery, [collectionName]);
                collectionChecks.push({
                    name: collectionName,
                    exists: checkResult.rows.length > 0,
                    data: checkResult.rows[0] || null
                });
            }

            return NextResponse.json({
                success: true,
                allCollections: result.rows,
                specificCollectionChecks: collectionChecks,
                totalCollections: result.rows.length
            });

        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Error debugging collections:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to debug collections', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}
