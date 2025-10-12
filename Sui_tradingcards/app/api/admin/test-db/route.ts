import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: Request) {
    console.log('Test DB API called');
    
    try {
        console.log('Attempting to connect to database...');
        const client = await pool.connect();
        console.log('Database connection successful');
        
        try {
            // Simple test query
            console.log('Executing test query...');
            const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
            console.log('Test query result:', result.rows);
            
            return NextResponse.json({
                success: true,
                message: 'Database connection successful',
                data: {
                    currentTime: result.rows[0].current_time,
                    postgresVersion: result.rows[0].postgres_version
                }
            });

        } finally {
            console.log('Releasing database connection');
            client.release();
        }

    } catch (error: any) {
        console.error('Database connection error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { 
                success: false,
                error: 'Database connection failed', 
                details: error.message,
                stack: error.stack
            }, 
            { status: 500 }
        );
    }
}
