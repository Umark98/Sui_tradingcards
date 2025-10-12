// Get user's NFT reservations
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';

// Admin whitelist - bypass database
const ADMIN_EMAILS = ['umarorakzai98@gmail.com'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if admin email - return empty for now
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      return NextResponse.json({
        success: true,
        reservations: [],
        stats: {
          total: 0,
          reserved: 0,
          claimed: 0,
          minted: 0,
        },
      });
    }

    const client = await pool.connect();

    try {
      // Verify user exists in the existing users table
      const userResult = await client.query(
        'SELECT user_id FROM users WHERE user_email = $1',
        [normalizedEmail]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userId = userResult.rows[0].user_id;

      // Get user's NFTs from the existing nfts table - exclude Moments collection
      const nftsResult = await client.query(
        `SELECT 
          n.nft_id,
          n.nft_title,
          n.nft_description,
          n.nft_serial_number,
          nt.type_name as type,
          n.rarity,
          n.m_level,
          n.edition_size,
          a.name as artist,
          c.name as collection_name,
          p.name as platform,
          CASE 
            WHEN n.status = 'collected' THEN 'claimed'
            ELSE 'reserved'
          END as status,
          n.nft_id as transaction_digest,
          CURRENT_TIMESTAMP as created_at,
          n.minted_at
         FROM nfts n
         LEFT JOIN nft_types nt ON n.type_id = nt.type_id
         LEFT JOIN artists a ON n.artist_id = a.artist_id
         LEFT JOIN collections c ON n.collection_id = c.collection_id
         LEFT JOIN platforms p ON c.platform_id = p.platform_id
         WHERE n.user_id = $1
           AND c.name != 'Moments'
         ORDER BY n.nft_id DESC`,
        [userId]
      );

      const reservations = nftsResult.rows.map((row: any) => ({
        id: row.nft_id,
        nftTitle: row.nft_title,
        nftType: row.type,
        rarity: row.rarity,
        level: row.m_level,
        collectionName: row.collection_name,
        description: row.nft_description,
        metadataUri: null,
        imageUrl: null,
        status: 'reserved', // All existing NFTs are available for collection
        voucherId: null,
        voucherExpiry: null,
        objectId: null,
        transactionDigest: row.transaction_digest,
        createdAt: row.created_at,
        mintedAt: row.minted_at,
      }));

      // Get summary stats
      const stats = {
        total: reservations.length,
        reserved: reservations.filter(r => r.status === 'reserved').length,
        claimed: reservations.filter(r => r.status === 'claimed').length,
        minted: 0,
      };

      return NextResponse.json({
        success: true,
        reservations,
        stats,
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Get reservations error:', error);
    return NextResponse.json(
      { error: 'Failed to get reservations', details: error.message },
      { status: 500 }
    );
  }
}

