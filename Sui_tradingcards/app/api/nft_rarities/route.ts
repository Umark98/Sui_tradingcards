import pool from '@/service/pool';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT rarity_id, rarity_name
      FROM nft_rarities
      ORDER BY rarity_id
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching NFT rarities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT rarities', details: error.message },
      { status: 500 }
    );
  }
}
