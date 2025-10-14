// User login API - Simple email-based authentication
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const client = await pool.connect();

    try {
      // Get user from users table (NOT portal_users)
      const userCheckResult = await client.query(
        `SELECT user_id, user_email, wallet_address, wallet_created_at 
         FROM users 
         WHERE user_email = $1`,
        [normalizedEmail]
      );

      if (userCheckResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found in our database.' },
          { status: 404 }
        );
      }

      const user = userCheckResult.rows[0];

      // Get user's NFT stats from nfts table
      const nftsStatsResult = await client.query(
        `SELECT 
          COUNT(*) as total_nfts,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'minted' THEN 1 ELSE 0 END) as collected
         FROM nfts 
         WHERE user_id = $1`,
        [user.user_id]
      );

      // Get user's NFT stats from nft_reservations table
      const reservationsStatsResult = await client.query(
        `SELECT 
          COUNT(*) as total_nfts,
          SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status IN ('claimed', 'minted') THEN 1 ELSE 0 END) as collected
         FROM nft_reservations 
         WHERE email = $1`,
        [normalizedEmail]
      );

      const nftsStats = nftsStatsResult.rows[0];
      const reservationsStats = reservationsStatsResult.rows[0];

      // Combine stats from both tables
      const stats = {
        total_nfts: (parseInt(nftsStats.total_nfts) || 0) + (parseInt(reservationsStats.total_nfts) || 0),
        available: (parseInt(nftsStats.available) || 0) + (parseInt(reservationsStats.available) || 0),
        collected: (parseInt(nftsStats.collected) || 0) + (parseInt(reservationsStats.collected) || 0),
      };

      return NextResponse.json({
        success: true,
        user: {
          id: user.user_id,
          email: user.user_email,
          wallet: user.wallet_address,
          verified: true,
          createdAt: user.wallet_created_at,
        },
        stats: {
          totalNFTs: stats.total_nfts,
          availableToCollect: stats.available,
          alreadyClaimed: stats.collected,
        },
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login', details: error.message },
      { status: 500 }
    );
  }
}

