import { comparePasswords, SignInRoute } from '@/lib/auth/authController';
import { NextResponse } from 'next/server';
// import { comparePasswords ,SignInRoute} from '@/lib/auth/authController';

export async function POST(request) {
  try {
    const body = await request.json();

    const user = await comparePasswords(body.email, body.password);
    const response = await SignInRoute({ ...body, user });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Signin failed' }, { status: 401 });
  }
}