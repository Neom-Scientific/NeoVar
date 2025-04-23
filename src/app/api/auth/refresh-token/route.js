import { NextResponse } from 'next/server';
import { RefreshTokenRoute } from '@/lib/auth/authController';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const response = await RefreshTokenRoute(token);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Refresh failed' }, { status: 403 });
  }
}
