import { comparePasswords, SignInRoute } from '@/lib/auth/authController';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';
// import { comparePasswords ,SignInRoute} from '@/lib/auth/authController';

export async function POST(request) {
  try {
    const body = await request.json();

    const user = await comparePasswords(body.email, body.password);
    const { access_token, refreshToken } = await SignInRoute({ ...body, user });
    const response = NextResponse.json({ access_token, refreshToken }, { status: 200 });
    response.headers.set('Set-Cookie', serialize('access_token', access_token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    }));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Signin failed' }, { status: 401 });
  }
}