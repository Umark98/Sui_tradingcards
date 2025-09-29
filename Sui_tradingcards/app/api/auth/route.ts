// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mockLogin, mockSignup } from '@/lib/auth';

export async function GET() {
  return NextResponse.json({ message: 'Auth API is active' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password } = body;

    if (action === 'login') {
      const result = await mockLogin(username, password);
      return NextResponse.json(result);
    } else if (action === 'signup') {
      const result = await mockSignup(username, password);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    );
  }
}