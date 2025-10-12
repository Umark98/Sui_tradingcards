// Generate voucher for NFT collection
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';
import { generateSignedVoucher } from '@/utils/voucherUtils';

export async function POST(request: NextRequest) {
  try {
    const { email, reservationId } = await request.json();

    if (!email || !reservationId) {
      return NextResponse.json(
        { error: 'Email and reservation ID are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get user's custodial wallet
      const userResult = await client.query(
        'SELECT custodial_wallet, verified FROM portal_users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      if (!user.verified) {
        return NextResponse.json(
          { error: 'Please verify your email first' },
          { status: 403 }
        );
      }

      // Get reservation details
      const reservationResult = await client.query(
        `SELECT 
          id, email, nft_title, nft_type, rarity, level, 
          metadata_uri, status, voucher_id
         FROM nft_reservations 
         WHERE id = $1 AND email = $2`,
        [reservationId, email.toLowerCase()]
      );

      if (reservationResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Reservation not found or does not belong to this user' },
          { status: 404 }
        );
      }

      const reservation = reservationResult.rows[0];

      // Check if already claimed
      if (reservation.status !== 'reserved') {
        return NextResponse.json(
          { error: `NFT already ${reservation.status}` },
          { status: 400 }
        );
      }

      // Check if voucher already exists and is still valid
      if (reservation.voucher_id) {
        const existingVoucher = await client.query(
          'SELECT voucher_id, voucher_expiry FROM nft_reservations WHERE id = $1',
          [reservationId]
        );

        if (existingVoucher.rows[0].voucher_expiry > Math.floor(Date.now() / 1000)) {
          return NextResponse.json({
            message: 'Voucher already exists and is valid',
            voucherId: existingVoucher.rows[0].voucher_id,
          });
        }
      }

      // Generate voucher and signature
      const { voucher, signature } = generateSignedVoucher(
        reservation.id,
        user.custodial_wallet,
        reservation.nft_title,
        reservation.nft_type,
        reservation.rarity,
        reservation.level,
        reservation.metadata_uri || '',
        email.toLowerCase(),
        30 // 30 days expiry
      );

      // Update reservation with voucher details
      await client.query(
        `UPDATE nft_reservations 
         SET voucher_id = $1, 
             voucher_signature = $2, 
             voucher_expiry = $3
         WHERE id = $4`,
        [voucher.voucherId, signature, voucher.expiry, reservationId]
      );

      // Log voucher generation
      await client.query(
        `INSERT INTO voucher_logs (reservation_id, voucher_id, email, status)
         VALUES ($1, $2, $3, $4)`,
        [reservationId, voucher.voucherId, email.toLowerCase(), 'generated']
      );

      // Log activity
      await client.query(
        `INSERT INTO user_activity_log (email, activity_type, activity_data)
         VALUES ($1, $2, $3)`,
        [email.toLowerCase(), 'voucher_generated', { reservationId, voucherId: voucher.voucherId }]
      );

      return NextResponse.json({
        success: true,
        message: 'Voucher generated successfully',
        voucher: {
          voucherId: voucher.voucherId,
          targetAddress: voucher.targetAddress,
          nftTitle: voucher.nftTitle,
          nftType: voucher.nftType,
          rarity: voucher.rarity,
          level: voucher.level,
          expiry: voucher.expiry,
          signature,
        },
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Generate voucher error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voucher', details: error.message },
      { status: 500 }
    );
  }
}

