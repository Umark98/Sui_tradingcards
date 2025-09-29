import pool from '@/service/pool';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT level_id, level_value
      FROM nft_mint_levels
      ORDER BY level_id
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching NFT mint levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT mint levels', details: error.message },
      { status: 500 }
    );
  }
}
