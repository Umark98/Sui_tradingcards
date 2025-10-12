// Email verification API
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and verification token are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Verify token
      const result = await client.query(
        `UPDATE portal_users 
         SET verified = true, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE email = $1 AND verification_token = $2
         RETURNING id, email, custodial_wallet, verified`,
        [email.toLowerCase(), token]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid verification token or email' },
          { status: 400 }
        );
      }

      const user = result.rows[0];

      // Log activity
      await client.query(
        `INSERT INTO user_activity_log (email, activity_type)
         VALUES ($1, $2)`,
        [email.toLowerCase(), 'email_verified']
      );

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          wallet: user.custodial_wallet,
          verified: user.verified,
        },
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email', details: error.message },
      { status: 500 }
    );
  }
}

