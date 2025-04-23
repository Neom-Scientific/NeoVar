import { NextResponse } from 'next/server';
import { SignOutRoute } from '@/lib/auth/authController';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const email = request.headers.get('email'); // Pass user email in header

    const result = await SignOutRoute(token, email);
    return NextResponse.json(result, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Signout failed' }, { status: 500 });
  }
}
