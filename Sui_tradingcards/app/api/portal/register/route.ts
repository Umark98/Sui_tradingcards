// User registration API - Creates custodial wallet and user account
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';
import { generateCustodialWallet, encryptPrivateKey, generateVerificationToken } from '@/utils/walletUtils';

// Whitelist of admin emails allowed to register
const ADMIN_WHITELIST = ['umarorakzai98@gmail.com'];

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const client = await pool.connect();

    try {
      // Check if user already exists in portal
      const existingPortalUser = await client.query(
        'SELECT email, custodial_wallet, verified FROM portal_users WHERE email = $1',
        [normalizedEmail]
      );

      if (existingPortalUser.rows.length > 0) {
        const user = existingPortalUser.rows[0];
        
        if (user.verified) {
          return NextResponse.json(
            { 
              error: 'User already registered and verified',
              wallet: user.custodial_wallet 
            },
            { status: 400 }
          );
        }

        // User exists but not verified - resend verification
        return NextResponse.json({
          message: 'User already exists. Please verify your email.',
          wallet: user.custodial_wallet,
          verified: false,
        });
      }

      // Check if user exists in legacy database OR is in admin whitelist
      const legacyUser = await client.query(
        'SELECT user_email FROM users WHERE user_email = $1',
        [normalizedEmail]
      );

      const isAdminWhitelisted = ADMIN_WHITELIST.includes(normalizedEmail);

      if (legacyUser.rows.length === 0 && !isAdminWhitelisted) {
        return NextResponse.json(
          { 
            error: 'Access denied. Only existing users can register for the portal.',
            hint: 'Your email must exist in our database to access the portal.'
          },
          { status: 403 }
        );
      }

      // Generate custodial wallet
      const wallet = generateCustodialWallet();
      const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);
      const verificationToken = generateVerificationToken();

      // Insert new user (auto-verify admin whitelist users)
      const autoVerify = isAdminWhitelisted;
      const result = await client.query(
        `INSERT INTO portal_users (email, custodial_wallet, encrypted_private_key, verification_token, verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, custodial_wallet, verified`,
        [normalizedEmail, wallet.address, encryptedPrivateKey, verificationToken, autoVerify]
      );

      const newUser = result.rows[0];

      // Log activity
      await client.query(
        `INSERT INTO user_activity_log (email, activity_type, activity_data)
         VALUES ($1, $2, $3)`,
        [normalizedEmail, 'user_registered', { wallet: wallet.address, isAdmin: isAdminWhitelisted }]
      );

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          wallet: newUser.custodial_wallet,
          verified: newUser.verified,
        },
        verificationToken, // In production, send this via email
      }, { status: 201 });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user', details: error.message },
      { status: 500 }
    );
  }
}

