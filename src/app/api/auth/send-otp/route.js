// File: src/app/api/auth/send-otp/route.js
import { sendOtp } from '@/lib/auth/authController';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const otp = await sendOtp(body.email);
    return NextResponse.json({ message: 'OTP sent', otp }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}
