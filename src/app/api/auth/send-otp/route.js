import { comparePasswords, sendOtp } from '@/lib/auth/authController';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const response = [];
    const body = await request.json();
    // console.log('body:', body);

    // Compare passwords
    try {
      const passwords = await comparePasswords(body.email, body.password);
      if (!passwords) {
        response.push({
          message: 'Invalid email or password',
          status: 401
        })
        return NextResponse.json(response);
      }
    } catch (error) {
      // Handle specific error from comparePasswords
      if (error.message === 'Enter valid password') {
        response.push({
          message: 'Enter valid password',
          status: 401
        });
      }
      else if (error.message === 'Invalid email or password') {
        response.push({
          message: 'Invalid email or password',
          status: 401
        });
      }
      else{
        response.push({
          message: 'An unexpected error occurred while comparing passwords',
          status: 500
        });
      }
      console.error('Unexpected error in comparePasswords:', error);
     return NextResponse.json(response);
    }

    // Generate and send OTP
    const otp = await sendOtp(body.email);
    response.push({
      message: 'OTP sent successfully',
      otp: otp, // Include OTP in the response for testing purposes
      status: 200
    });

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}