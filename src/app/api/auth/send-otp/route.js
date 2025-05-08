import { comparePasswords, sendOtp } from '@/lib/auth/authController';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('body:', body);

    // Compare passwords
    try {
      const passwords = await comparePasswords(body.email, body.password);
      if (!passwords) {
        return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
      }
    } catch (error) {
      // Handle specific error from comparePasswords
      if (error.message === 'Enter valid password') {
        return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
      }
      if (error.message === 'Invalid email or password') {
        return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
      }
      console.error('Unexpected error in comparePasswords:', error);
      return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
    }

    // Generate and send OTP
    const otp = await sendOtp(body.email);
    return NextResponse.json({ message: 'OTP sent', otp }, { status: 200 });
  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}