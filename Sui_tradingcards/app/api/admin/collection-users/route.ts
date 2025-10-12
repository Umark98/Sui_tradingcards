import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: Request) {
    console.log('Collection Users API called');
    
    try {
        console.log('Attempting to connect to database...');
        const client = await pool.connect();
        console.log('Database connection successful');
        
        try {
            // Get query parameters
            const url = new URL(request.url);
            const collectionName = url.searchParams.get('collection');
            const limit = url.searchParams.get('limit') || '1000';
            const missionTypes = url.searchParams.get('missionTypes');

            console.log('Query parameters:', { collectionName, limit, missionTypes });
            
            if (!collectionName) {
                console.log('Error: Collection name is required');
                return NextResponse.json(
                    { success: false, error: 'Collection name is required' },
                    { status: 400 }
                );
            }

            // Parse mission types if provided
            let missionTypesArray: string[] = [];
            if (missionTypes) {
                missionTypesArray = missionTypes.split(',').map(type => decodeURIComponent(type));
            }

            // Build the query with optional mission type filtering
            let whereClause = 'WHERE c.name = $1';
            let queryParams: any[] = [collectionName];
            let paramIndex = 2;

            if (missionTypesArray.length > 0) {
                // Create placeholders for the mission types
                const placeholders = missionTypesArray.map((_, index) => `$${paramIndex + index}`).join(',');
                whereClause += ` AND nt.type_name IN (${placeholders})`;
                queryParams.push(...missionTypesArray);
                paramIndex += missionTypesArray.length;
            }

            const query = `
                SELECT 
                    u.user_id,
                    u.user_email,
                    n.nft_title,
                    n.nft_description,
                    n.nft_serial_number,
                    n.numentities,
                    n.type,
                    n.rarity,
                    n.m_level AS minted_level,
                    n.edition_size,
                    nt.type_name,
                    nr.rarity_name,
                    nml.level_value,
                    c.name AS collection_name,
                    c.series AS collection_series,
                    a.name AS artist_name,
                    a.copyright AS artist_copyright,
                    p.name AS platform_name
                FROM users u
                JOIN nfts n ON u.user_id = n.user_id
                LEFT JOIN nft_types nt ON n.type_id = nt.type_id
                LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
                LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
                LEFT JOIN collections c ON n.collection_id = c.collection_id
                LEFT JOIN artists a ON n.artist_id = a.artist_id
                LEFT JOIN platforms p ON c.platform_id = p.platform_id
                ${whereClause}
                ORDER BY 
                    u.user_email ASC,
                    n.nft_title ASC,
                    nr.rarity_id ASC,
                    nml.level_value ASC
                LIMIT $${paramIndex}
            `;

            console.log('Executing main query:', query);
            console.log('Query parameters:', queryParams);
            console.log('Limit parameter:', parseInt(limit));
            
            const result = await client.query(query, [...queryParams, parseInt(limit)]);
            console.log('Main query result:', result.rows.length, 'rows');

            // Get summary statistics
            const statsQuery = `
                SELECT 
                    COUNT(DISTINCT u.user_id) AS total_users,
                    COUNT(n.nft_id) AS total_nfts,
                    COUNT(DISTINCT nt.type_name) AS unique_types,
                    COUNT(DISTINCT nr.rarity_name) AS unique_rarities
                FROM users u
                JOIN nfts n ON u.user_id = n.user_id
                LEFT JOIN nft_types nt ON n.type_id = nt.type_id
                LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
                LEFT JOIN collections c ON n.collection_id = c.collection_id
                ${whereClause}
            `;

            const statsResult = await client.query(statsQuery, queryParams);

            // Get type distribution
            const distributionQuery = `
                SELECT 
                    nt.type_name,
                    COUNT(n.nft_id) AS total_nfts,
                    COUNT(DISTINCT u.user_id) AS unique_users
                FROM nfts n
                JOIN users u ON n.user_id = u.user_id
                LEFT JOIN nft_types nt ON n.type_id = nt.type_id
                LEFT JOIN collections c ON n.collection_id = c.collection_id
                ${whereClause}
                GROUP BY nt.type_name
                ORDER BY total_nfts DESC
                LIMIT 20
            `;

            const distributionResult = await client.query(distributionQuery, queryParams);

            // Get top users
            const topUsersQuery = `
                SELECT 
                    u.user_id,
                    u.user_email,
                    COUNT(n.nft_id) AS nft_count,
                    COUNT(DISTINCT nt.type_name) AS unique_types,
                    STRING_AGG(DISTINCT nt.type_name, ', ') AS nft_types
                FROM users u
                JOIN nfts n ON u.user_id = n.user_id
                LEFT JOIN nft_types nt ON n.type_id = nt.type_id
                LEFT JOIN collections c ON n.collection_id = c.collection_id
                ${whereClause}
                GROUP BY u.user_id, u.user_email
                ORDER BY nft_count DESC
                LIMIT 10
            `;

            const topUsersResult = await client.query(topUsersQuery, queryParams);

            const collectionUsers = result.rows.map((row: any) => ({
                userId: row.user_id,
                userEmail: row.user_email,
                nftTitle: row.nft_title,
                nftDescription: row.nft_description,
                nftSerialNumber: row.nft_serial_number,
                numEntities: row.numentities,
                type: row.type,
                rarity: row.rarity,
                mintedLevel: row.minted_level,
                editionSize: row.edition_size,
                typeName: row.type_name,
                rarityName: row.rarity_name,
                levelValue: row.level_value,
                collectionName: row.collection_name,
                collectionSeries: row.collection_series,
                artistName: row.artist_name,
                artistCopyright: row.artist_copyright,
                platformName: row.platform_name
            }));

            const stats = {
                totalUsers: parseInt(statsResult.rows[0].total_users),
                totalNfts: parseInt(statsResult.rows[0].total_nfts),
                uniqueTypes: parseInt(statsResult.rows[0].unique_types),
                uniqueRarities: parseInt(statsResult.rows[0].unique_rarities)
            };

            const distribution = distributionResult.rows.map((row: any) => ({
                type: row.type_name || 'Unknown',
                totalNfts: parseInt(row.total_nfts),
                uniqueUsers: parseInt(row.unique_users)
            }));

            const topUsers = topUsersResult.rows.map((row: any) => ({
                userId: row.user_id,
                userEmail: row.user_email,
                nftCount: parseInt(row.nft_count),
                uniqueTypes: parseInt(row.unique_types),
                nftTypes: row.nft_types || 'Unknown'
            }));

            return NextResponse.json({
                success: true,
                stats,
                distribution,
                topUsers,
                collectionUsers,
                filters: {
                    collectionName,
                    limit: parseInt(limit)
                },
                totalResults: collectionUsers.length,
                collectionName
            });

        } finally {
            console.log('Releasing database connection');
            client.release();
        }

    } catch (error: any) {
        console.error('Error fetching collection users:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to fetch collection users', 
                details: error.message,
                stack: error.stack
            }, 
            { status: 500 }
        );
    }
}
