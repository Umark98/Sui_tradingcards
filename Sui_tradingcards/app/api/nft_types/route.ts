import pool from '@/service/pool';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT type_id, type_name
      FROM nft_types
      ORDER BY type_name
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching NFT types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT types', details: error.message },
      { status: 500 }
    );
  }
}
