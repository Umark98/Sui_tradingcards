import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    
    try {
      // Get query parameters
      const url = new URL(request.url);
      const cardTitle = url.searchParams.get('cardTitle');

      if (!cardTitle) {
        return NextResponse.json(
          { error: 'Card title is required' },
          { status: 400 }
        );
      }

      // Simple query to get basic card information
      const cardDetailsQuery = `
        SELECT 
          n.nft_title,
          nt.type_name,
          c.name as collection_name,
          COUNT(n.nft_id) as total_nfts,
          COUNT(DISTINCT n.user_id) as unique_owners,
          MIN(n.nft_serial_number) as min_serial,
          MAX(n.nft_serial_number) as max_serial
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        WHERE n.nft_title = $1
        GROUP BY n.nft_title, nt.type_name, c.name
      `;

      const cardResult = await client.query(cardDetailsQuery, [cardTitle]);

      if (cardResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Card not found' },
          { status: 404 }
        );
      }

      const cardDetails = cardResult.rows[0];

      // Get users who own this card type
      const usersQuery = `
        SELECT 
          u.user_id,
          u.user_email,
          COUNT(n.nft_id) as owned_count,
          MIN(n.nft_serial_number) as first_owned,
          MAX(n.nft_serial_number) as last_owned
        FROM nfts n
        JOIN users u ON n.user_id = u.user_id
        WHERE n.nft_title = $1
        GROUP BY u.user_id, u.user_email
        ORDER BY owned_count DESC, u.user_email
        LIMIT 20
      `;

      const usersResult = await client.query(usersQuery, [cardTitle]);

      // Get recent NFTs of this type (ordered by NFT ID, which typically represents when they were added to the database)
      const recentActivityQuery = `
        SELECT 
          n.nft_id,
          n.nft_serial_number,
          u.user_email
        FROM nfts n
        JOIN users u ON n.user_id = u.user_id
        WHERE n.nft_title = $1
        ORDER BY n.nft_id DESC
        LIMIT 15
      `;

      const recentActivityResult = await client.query(recentActivityQuery, [cardTitle]);

      const response = {
        cardDetails: {
          title: cardDetails.nft_title,
          type: cardDetails.type_name,
          collection: cardDetails.collection_name,
          rarity: null,
          level: null,
          totalNfts: parseInt(cardDetails.total_nfts),
          uniqueOwners: parseInt(cardDetails.unique_owners),
          serialRange: {
            min: cardDetails.min_serial,
            max: cardDetails.max_serial
          }
        },
        topOwners: usersResult.rows.map((user: any) => ({
          userId: user.user_id,
          email: user.user_email,
          name: null,
          ownedCount: parseInt(user.owned_count),
          serialRange: {
            first: user.first_owned,
            last: user.last_owned
          }
        })),
        recentActivity: recentActivityResult.rows.map((activity: any) => ({
          nftId: activity.nft_id,
          serialNumber: activity.nft_serial_number,
          userEmail: activity.user_email,
          userName: null,
          rarity: null,
          level: null,
          collection: cardDetails.collection_name
        }))
      };

      return NextResponse.json(response);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching card details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
