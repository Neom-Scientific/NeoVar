// import { hashPassword, SignUpRoute } from "../../authentication";


// export default async function handler(req, res) {
//   console.log('Request received:', req.method, req.body);
//   if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

//   await hashPassword(req, res, async () => {
//     await SignUpRoute(req, res);
//   });
// }

// import { NextResponse } from 'next/server';
// import { hashPassword, SignUpRoute } from '../../authentication';


// export async function POST(request) {
//   try {
//     const body = await request.json();
//     const hashedPassword = await hashPassword(body.password);
//     const modifiedBody = { ...body, password: hashedPassword };

//     const result = await SignUpRoute(modifiedBody);

//     return NextResponse.json(result, { status: 201 });
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 409 });
//   }
// }

// File: src/app/api/auth/signup/route.js
import { hashPassword, SignUpRoute } from '@/lib/auth/authController';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    // Hash the password
    const hashedPassword = await hashPassword(body.password);
    const modifiedBody = { ...body, password: hashedPassword };

    // Call the signup logic
    const result = await SignUpRoute(modifiedBody);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error during signup:', error);
    const isEmailExists = error.message.includes('Email already exists');
    return NextResponse.json(
      { error: error.message },
      { status: isEmailExists ? 409 : 500 }
    );
  }
}


