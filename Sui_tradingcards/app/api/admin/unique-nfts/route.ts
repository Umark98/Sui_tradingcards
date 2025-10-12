import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: Request) {
  try {
    const client = await pool.connect();
    
    try {
      // Get query parameters for filtering
      const url = new URL(request.url);
      const collection = url.searchParams.get('collection');
      const type = url.searchParams.get('type');
      const rarity = url.searchParams.get('rarity');
      const level = url.searchParams.get('level');
      const limit = url.searchParams.get('limit') || '1000';

      // Build the WHERE clause based on filters
      let whereClause = "WHERE n.nft_title IS NOT NULL AND n.nft_title != ''";
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (collection) {
        whereClause += ` AND c.name = $${paramIndex}`;
        queryParams.push(collection);
        paramIndex++;
      }

      if (type) {
        whereClause += ` AND nt.type_name = $${paramIndex}`;
        queryParams.push(type);
        paramIndex++;
      }

      if (rarity) {
        whereClause += ` AND nr.rarity_name = $${paramIndex}`;
        queryParams.push(rarity);
        paramIndex++;
      }

      if (level) {
        whereClause += ` AND nml.level_value = $${paramIndex}`;
        queryParams.push(parseInt(level));
        paramIndex++;
      }

      // Get unique NFT information grouped by title, type, collection, rarity, and level
      const result = await client.query(`
        SELECT 
          n.nft_title,
          n.nft_description,
          n.numentities,
          n.type,
          n.rarity,
          n.m_level AS minted_level,
          n.edition_size,
          nt.type_id,
          nt.type_name,
          nr.rarity_id,
          nr.rarity_name,
          nml.level_id,
          nml.level_value,
          c.collection_id,
          c.name AS collection_name,
          c.series AS collection_series,
          a.artist_id,
          a.name AS artist_name,
          a.copyright AS artist_copyright,
          p.platform_id,
          p.name AS platform_name,
          COUNT(n.nft_id) AS total_instances,
          MIN(n.nft_serial_number) AS min_serial_number,
          MAX(n.nft_serial_number) AS max_serial_number,
          COUNT(DISTINCT n.user_id) AS unique_owners
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
        LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        LEFT JOIN artists a ON n.artist_id = a.artist_id
        LEFT JOIN platforms p ON c.platform_id = p.platform_id
        ${whereClause}
        GROUP BY 
          n.nft_title, n.nft_description, n.numentities, n.type, n.rarity, n.m_level, n.edition_size,
          nt.type_id, nt.type_name, nr.rarity_id, nr.rarity_name, nml.level_id, nml.level_value,
          c.collection_id, c.name, c.series, a.artist_id, a.name, a.copyright, p.platform_id, p.name
        ORDER BY 
          c.name ASC, 
          nt.type_name ASC, 
          n.nft_title ASC, 
          nr.rarity_id ASC, 
          nml.level_value ASC
        LIMIT $${paramIndex}
      `, [...queryParams, parseInt(limit)]);

      // Get summary statistics
      const statsResult = await client.query(`
        SELECT 
          COUNT(DISTINCT n.nft_title) AS unique_titles,
          COUNT(DISTINCT nt.type_name) AS unique_types,
          COUNT(DISTINCT c.name) AS unique_collections,
          COUNT(DISTINCT nr.rarity_name) AS unique_rarities,
          COUNT(DISTINCT nml.level_value) AS unique_levels,
          COUNT(n.nft_id) AS total_nfts,
          COUNT(DISTINCT n.user_id) AS total_owners
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
        LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
      `);

      const uniqueNfts = result.rows.map((row: any) => ({
        // Basic NFT Information
        nftTitle: row.nft_title,
        nftDescription: row.nft_description,
        numEntities: row.numentities,
        type: row.type,
        rarity: row.rarity,
        mintedLevel: row.minted_level,
        editionSize: row.edition_size,
        
        // Type Information
        typeId: row.type_id,
        typeName: row.type_name,
        
        // Rarity Information
        rarityId: row.rarity_id,
        rarityName: row.rarity_name,
        
        // Level Information
        levelId: row.level_id,
        levelValue: row.level_value,
        
        // Collection Information
        collectionId: row.collection_id,
        collectionName: row.collection_name,
        collectionSeries: row.collection_series,
        
        // Artist Information
        artistId: row.artist_id,
        artistName: row.artist_name,
        artistCopyright: row.artist_copyright,
        
        // Platform Information
        platformId: row.platform_id,
        platformName: row.platform_name,
        
        // Statistics
        totalInstances: parseInt(row.total_instances),
        minSerialNumber: row.min_serial_number,
        maxSerialNumber: row.max_serial_number,
        uniqueOwners: parseInt(row.unique_owners),
        
        // Unique Identifier
        uniqueKey: `${row.nft_title}_${row.collection_name || 'default'}_${row.rarity_name || 'unknown'}_${row.level_value || 'unknown'}`
      }));

      const stats = {
        uniqueTitles: parseInt(statsResult.rows[0].unique_titles),
        uniqueTypes: parseInt(statsResult.rows[0].unique_types),
        uniqueCollections: parseInt(statsResult.rows[0].unique_collections),
        uniqueRarities: parseInt(statsResult.rows[0].unique_rarities),
        uniqueLevels: parseInt(statsResult.rows[0].unique_levels),
        totalNfts: parseInt(statsResult.rows[0].total_nfts),
        totalOwners: parseInt(statsResult.rows[0].total_owners)
      };

      return NextResponse.json({
        success: true,
        stats,
        uniqueNfts,
        filters: {
          collection,
          type,
          rarity,
          level,
          limit: parseInt(limit)
        },
        totalResults: uniqueNfts.length
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error fetching unique NFTs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch unique NFT data', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}
