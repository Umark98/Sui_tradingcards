import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: Request) {
  try {
    const client = await pool.connect();
    
    try {
      // Get query parameters for filtering
      const url = new URL(request.url);
      const minDuplicates = url.searchParams.get('minDuplicates') || '2';
      const limit = url.searchParams.get('limit') || '100';

      // 1. Find NFTs with exact same title, type, rarity, and level
      const exactDuplicatesQuery = `
        SELECT 
          n.nft_title,
          nt.type_name,
          nr.rarity_name,
          nml.level_value,
          c.name AS collection_name,
          COUNT(n.nft_id) AS duplicate_count,
          MIN(n.nft_serial_number) AS min_serial,
          MAX(n.nft_serial_number) AS max_serial,
          COUNT(DISTINCT n.user_id) AS unique_owners,
          STRING_AGG(DISTINCT n.nft_description, ' | ') AS descriptions
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
        LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
        GROUP BY 
          n.nft_title, nt.type_name, nr.rarity_name, nml.level_value, c.name
        HAVING COUNT(n.nft_id) >= $1
        ORDER BY duplicate_count DESC
        LIMIT $2
      `;

      const exactDuplicates = await client.query(exactDuplicatesQuery, [parseInt(minDuplicates), parseInt(limit)]);

      // 2. Find NFTs with same title but different other attributes
      const titleDuplicatesQuery = `
        SELECT 
          n.nft_title,
          COUNT(DISTINCT CONCAT(nt.type_name, '|', nr.rarity_name, '|', nml.level_value, '|', c.name)) AS unique_combinations,
          COUNT(n.nft_id) AS total_instances,
          COUNT(DISTINCT n.user_id) AS unique_owners,
          STRING_AGG(DISTINCT nt.type_name, ', ') AS types,
          STRING_AGG(DISTINCT nr.rarity_name, ', ') AS rarities,
          STRING_AGG(DISTINCT c.name, ', ') AS collections
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
        LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
        GROUP BY n.nft_title
        HAVING COUNT(n.nft_id) >= $1
        ORDER BY total_instances DESC
        LIMIT $2
      `;

      const titleDuplicates = await client.query(titleDuplicatesQuery, [parseInt(minDuplicates), parseInt(limit)]);

      // 3. Find NFTs with same type and collection (potential bundling candidates)
      const typeCollectionDuplicatesQuery = `
        SELECT 
          nt.type_name,
          c.name AS collection_name,
          COUNT(DISTINCT n.nft_title) AS unique_titles,
          COUNT(n.nft_id) AS total_instances,
          COUNT(DISTINCT n.user_id) AS unique_owners,
          STRING_AGG(DISTINCT n.nft_title, ', ') AS sample_titles
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
        GROUP BY nt.type_name, c.name
        HAVING COUNT(n.nft_id) >= $1
        ORDER BY total_instances DESC
        LIMIT $2
      `;

      const typeCollectionDuplicates = await client.query(typeCollectionDuplicatesQuery, [parseInt(minDuplicates), parseInt(limit)]);

      // 4. Summary statistics
      const summaryQuery = `
        WITH duplicate_analysis AS (
          SELECT 
            n.nft_title,
            nt.type_name,
            nr.rarity_name,
            nml.level_value,
            c.name AS collection_name,
            COUNT(n.nft_id) AS instance_count
          FROM nfts n
          LEFT JOIN nft_types nt ON n.type_id = nt.type_id
          LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
          LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
          LEFT JOIN collections c ON n.collection_id = c.collection_id
          WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
          GROUP BY 
            n.nft_title, nt.type_name, nr.rarity_name, nml.level_value, c.name
        )
        SELECT 
          COUNT(*) AS total_unique_combinations,
          COUNT(CASE WHEN instance_count > 1 THEN 1 END) AS combinations_with_duplicates,
          COUNT(CASE WHEN instance_count >= 10 THEN 1 END) AS high_duplicate_combinations,
          COUNT(CASE WHEN instance_count >= 100 THEN 1 END) AS very_high_duplicate_combinations,
          SUM(instance_count) AS total_nfts,
          SUM(CASE WHEN instance_count > 1 THEN instance_count - 1 ELSE 0 END) AS total_duplicate_instances,
          ROUND(
            (SUM(CASE WHEN instance_count > 1 THEN instance_count - 1 ELSE 0 END)::DECIMAL / SUM(instance_count)) * 100, 
            2
          ) AS duplicate_percentage
        FROM duplicate_analysis
      `;

      const summary = await client.query(summaryQuery);

      // 5. Top duplicate patterns
      const topPatternsQuery = `
        SELECT 
          n.nft_title,
          nt.type_name,
          nr.rarity_name,
          nml.level_value,
          c.name AS collection_name,
          COUNT(n.nft_id) AS duplicate_count,
          ROUND((COUNT(n.nft_id)::DECIMAL / (SELECT COUNT(*) FROM nfts)) * 100, 2) AS percentage_of_total
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
        LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
        GROUP BY 
          n.nft_title, nt.type_name, nr.rarity_name, nml.level_value, c.name
        HAVING COUNT(n.nft_id) >= $1
        ORDER BY duplicate_count DESC
        LIMIT 20
      `;

      const topPatterns = await client.query(topPatternsQuery, [parseInt(minDuplicates)]);

      return NextResponse.json({
        success: true,
        summary: summary.rows[0],
        exactDuplicates: exactDuplicates.rows,
        titleDuplicates: titleDuplicates.rows,
        typeCollectionDuplicates: typeCollectionDuplicates.rows,
        topPatterns: topPatterns.rows,
        filters: {
          minDuplicates: parseInt(minDuplicates),
          limit: parseInt(limit)
        }
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error analyzing duplicate NFTs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze duplicate NFTs', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}
