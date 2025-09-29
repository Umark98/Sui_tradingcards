import pool from '@/service/pool';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json([]);
  }

  console.log('Search query:', q); // check what is coming

  try {
    const result = await pool.query(
      `
      SELECT DISTINCT u.user_email
      FROM users u
      WHERE u.user_email ILIKE $1
      LIMIT 10;
      `,
      [`%${q}%`]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Query failed', details: error.message },
      { status: 500 }
    );
  }
}
