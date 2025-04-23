// File: src/app/api/protected-route/route.js
import { authenticateToken } from '@/lib/auth/authController';
import { NextResponse } from 'next/server';
// import { authenticateToken } from '@/lib/auth/authenticateToken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = authenticateToken(authHeader); // Will throw error if invalid

    return NextResponse.json({ message: 'Protected data', user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
