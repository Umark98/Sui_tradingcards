// User login API - Simple email-based authentication
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';

// Admin whitelist - bypass database
const ADMIN_EMAILS = ['umarorakzai98@gmail.com'];

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

    // Check if admin email - bypass database
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      return NextResponse.json({
        success: true,
        user: {
          id: 999,
          email: normalizedEmail,
          wallet: '0xADMIN_WALLET_' + Math.random().toString(36).substring(7),
          verified: true,
          createdAt: new Date().toISOString(),
        },
        stats: {
          totalNFTs: 0,
          availableToCollect: 0,
          alreadyClaimed: 0,
        },
      });
    }

    const client = await pool.connect();

    try {
      // Get user from existing users table
      const result = await client.query(
        `SELECT user_id, user_email
         FROM users 
         WHERE user_email = $1`,
        [normalizedEmail]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found in our database.' },
          { status: 404 }
        );
      }

      const user = result.rows[0];

      // Get user's NFT count from the existing nfts table
      const nftsResult = await client.query(
        `SELECT COUNT(*) as total_nfts
         FROM nfts 
         WHERE user_id = $1`,
        [user.user_id]
      );

      const totalNFTs = parseInt(nftsResult.rows[0].total_nfts);

      return NextResponse.json({
        success: true,
        user: {
          id: user.user_id,
          email: user.user_email,
          wallet: 'Generated for user ' + user.user_id, // Placeholder wallet
          verified: true, // Assume verified since they have NFTs
          createdAt: new Date().toISOString(),
        },
        stats: {
          totalNFTs: totalNFTs,
          availableToCollect: totalNFTs, // All NFTs are available for collection
          alreadyClaimed: 0, // None collected yet
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

