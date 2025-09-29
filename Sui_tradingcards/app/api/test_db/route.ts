import pool from '@/service/pool';
import { NextResponse } from 'next/server';

interface WalletEmail {
  wallet_address: string;
  user_email: string;
}

export async function GET() {
  try {
    // A simple query to test the database connection without needing a specific table.
    const result = await pool.query(`
      SELECT 1 AS connection_test
    `);
    
    // If the query succeeds, return a success message.
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful!', 
      data: result.rows 
    });
  } catch (error: any) {
    // If the query fails, return a detailed error message.
    return NextResponse.json(
      { success: false, error: 'Database connection failed', details: error.message },
      { status: 500 }
    );
  }
}
