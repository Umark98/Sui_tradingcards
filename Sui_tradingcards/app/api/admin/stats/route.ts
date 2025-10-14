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

      // Get total NFTs minted from both tables
      const mintResult = await client.query(`
        SELECT COUNT(*) as total FROM nfts
      `);
      
      // Get total minted from reservations table
      const reservationsMintResult = await client.query(`
        SELECT COUNT(*) as total FROM nft_reservations WHERE status = 'minted'
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

      // Get recent mints from nfts table
      const recentMintsFromNfts = await client.query(`
        SELECT 
          n.nft_id,
          n.nft_title,
          nt.type_name,
          nr.rarity_name,
          nml.level_value,
          u.user_email,
          u.wallet_address,
          n.nft_serial_number,
          n.transaction_digest,
          n.mint_number,
          n.minted_at,
          n.status,
          c.name as collection_name,
          'nfts_table' as source
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
        LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
        LEFT JOIN users u ON n.user_id = u.user_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        WHERE n.status = 'collected' OR n.transaction_digest IS NOT NULL OR n.minted_at IS NOT NULL
        ORDER BY COALESCE(n.minted_at, CURRENT_TIMESTAMP) DESC, n.nft_id DESC
        LIMIT 10
      `);

      // Get recent mints from nft_reservations table (portal mints)
      const recentMintsFromReservations = await client.query(`
        SELECT 
          id as nft_id,
          nft_title,
          nft_type as type_name,
          rarity,
          level as level_value,
          email as user_email,
          null as wallet_address,
          null as nft_serial_number,
          transaction_digest,
          level as mint_number,
          minted_at,
          status,
          collection_name,
          'reservations_table' as source
        FROM nft_reservations
        WHERE status = 'minted' AND transaction_digest IS NOT NULL
        ORDER BY minted_at DESC
        LIMIT 10
      `);

      // Combine results and sort by minted_at
      const allRecentMints = [
        ...recentMintsFromNfts.rows,
        ...recentMintsFromReservations.rows
      ].sort((a, b) => {
        const dateA = new Date(a.minted_at || 0);
        const dateB = new Date(b.minted_at || 0);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, 20);

      const stats = {
        totalConfigurations: parseInt(configResult.rows[0].total),
        totalMinted: parseInt(mintResult.rows[0].total) + parseInt(reservationsMintResult.rows[0].total),
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
        recentMints: allRecentMints.map((row: any) => ({
          id: `nft_${row.nft_id}_${row.source}`,
          nftTitle: row.nft_title || 'Unknown NFT',
          cardType: row.type_name || 'Unknown Type',
          collectionName: row.collection_name || 'Unknown Collection',
          rarity: row.rarity_name || row.rarity || 'Unknown',
          level: row.level_value || 1,
          recipient: row.wallet_address || row.user_email,
          recipientEmail: row.user_email,
          timestamp: row.minted_at ? new Date(row.minted_at).toISOString() : new Date().toISOString(),
          transactionDigest: row.transaction_digest || `pending_${row.nft_id}`,
          mintNumber: row.mint_number || null,
          status: row.status || 'available',
          serialNumber: row.nft_serial_number,
          source: row.source
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

