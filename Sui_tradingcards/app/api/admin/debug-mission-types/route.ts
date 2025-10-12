import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: Request) {
    try {
        const client = await pool.connect();
        
        try {
            // Get all mission-related type names from the database
            const query = `
                SELECT DISTINCT 
                    nt.type_name,
                    COUNT(n.nft_id) as count
                FROM nfts n
                JOIN nft_types nt ON n.type_id = nt.type_id
                JOIN collections c ON n.collection_id = c.collection_id
                WHERE c.name = 'Missions' 
                AND nt.type_name LIKE '%Mission%'
                GROUP BY nt.type_name
                ORDER BY nt.type_name
            `;

            // Also get ALL types in the Missions collection (not just Mission*)
            const allMissionCollectionQuery = `
                SELECT DISTINCT 
                    nt.type_name,
                    COUNT(n.nft_id) as count
                FROM nfts n
                JOIN nft_types nt ON n.type_id = nt.type_id
                JOIN collections c ON n.collection_id = c.collection_id
                WHERE c.name = 'Missions'
                GROUP BY nt.type_name
                ORDER BY nt.type_name
            `;

            const result = await client.query(query);
            const allMissionTypesResult = await client.query(allMissionCollectionQuery);

            // Also get all type names in the Missions collection (legacy query)
            const allTypesQuery = `
                SELECT DISTINCT 
                    nt.type_name,
                    COUNT(n.nft_id) as count
                FROM nfts n
                JOIN nft_types nt ON n.type_id = nt.type_id
                JOIN collections c ON n.collection_id = c.collection_id
                WHERE c.name = 'Missions'
                GROUP BY nt.type_name
                ORDER BY nt.type_name
                LIMIT 50
            `;

            const allTypesResult = await client.query(allTypesQuery);

            return NextResponse.json({
                success: true,
                missionTypes: result.rows,
                allMissionCollectionTypes: allMissionTypesResult.rows,
                legacyMissionTypes: allTypesResult.rows,
                totalMissionTypes: result.rows.length,
                totalAllMissionTypes: allMissionTypesResult.rows.length,
                totalLegacyTypes: allTypesResult.rows.length
            });

        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Error debugging mission types:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to debug mission types', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}
