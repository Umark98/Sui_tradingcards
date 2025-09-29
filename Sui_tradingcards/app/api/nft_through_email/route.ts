import pool from '@/service/pool';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
          u.user_email,
          n.nft_serial_number,
          n.nft_title,
          n.nft_description,
          n.numentities,
          n.type,
          n.rarity,
          n.m_level AS minted_level,  -- renamed for frontend
          n.edition_size,
          a.name AS artist,
          a.copyright AS copyright,
          c.name AS collection,
          c.series AS series,
          p.name AS platform
      FROM users u
      JOIN nfts n ON u.user_id = n.user_id
      LEFT JOIN artists a ON n.artist_id = a.artist_id
      LEFT JOIN collections c ON n.collection_id = c.collection_id
      LEFT JOIN platforms p ON c.platform_id = p.platform_id
      WHERE u.user_email = $1
      ORDER BY n.nft_id;
      `,
      [email]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
