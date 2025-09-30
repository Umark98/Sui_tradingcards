import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // Get total NFT types (configurations)
      const configResult = await client.query(`
        SELECT COUNT(*) as total FROM nft_types
      `);

      // Get total NFTs minted
      const mintResult = await client.query(`
        SELECT COUNT(*) as total FROM nfts
      `);

      // Get cards by type with collection information
      const cardsByTypeResult = await client.query(`
        SELECT 
          nt.type_id,
          nt.type_name,
          c.name as collection_name,
          COUNT(n.nft_id) as count
        FROM nft_types nt
        LEFT JOIN nfts n ON nt.type_id = n.type_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        GROUP BY nt.type_id, nt.type_name, c.name
        ORDER BY count DESC
      `);

      // Get recent NFTs (using created_at if available, or nft_id as fallback)
      const recentMintsResult = await client.query(`
        SELECT 
          n.nft_id,
          nt.type_name,
          nr.rarity_name,
          nml.level_value,
          u.user_email,
          n.nft_serial_number,
          c.name as collection_name
        FROM nfts n
        JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
        LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
        JOIN users u ON n.user_id = u.user_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        ORDER BY n.nft_id DESC
        LIMIT 10
      `);

      const stats = {
        totalConfigurations: parseInt(configResult.rows[0].total),
        totalMinted: parseInt(mintResult.rows[0].total),
        cardsByType: cardsByTypeResult.rows.reduce((acc: any, row: any) => {
          // Use collection name to differentiate between similar type names
          let key = row.type_name;
          
          // Special handling for Collectors Edition types
          if (row.type_name === "Collector's Edition" || row.type_name === "Collectors Edition") {
            if (row.collection_name) {
              key = `${row.type_name} (${row.collection_name})`;
            } else {
              key = `${row.type_name} (ID: ${row.type_id})`;
            }
          }
          
          acc[key] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>),
        recentMints: recentMintsResult.rows.map((row: any) => ({
          id: `nft_${row.nft_id}`,
          cardType: row.type_name,
          level: row.level_value || 1,
          recipient: row.user_email,
          timestamp: new Date().toISOString(), // Using current time since we don't have created_at
          transactionDigest: `nft_${row.nft_serial_number}`
        }))
      };

      return NextResponse.json(stats);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

