import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import db from "@/lib/db";

const counterFile = path.join(process.cwd(), 'counter.json'); // adjust path as needed

export async function GET(req) {
    const email = req.nextUrl.searchParams.get('email'); // Correctly extract the email
    // console.log('email:', email);
    try {
        if (!email) {
            return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
        }

        const counterData = await db.query('SELECT * FROM CounterTasks WHERE email = $1', [email]);
        // console.log('counterData:', counterData);
        if (counterData.rowCount === 0) {
            return NextResponse.json({ error: 'No project found' }, { status: 200 });
        }
        const counter = counterData.rows;
        // console.log('counter:', counter);

        // Return the email in the response
        return NextResponse.json( counter );
    } catch (err) {
        console.error('Error in fetching the counter data:', err);
        return NextResponse.json({ error: 'Error in fetching the counter data' }, { status: 500 });
    }

    // try {
    //     if (!fs.existsSync(counterFile)) {
    //         return NextResponse.json({ error: 'Counter file not found' }, { status: 404 });
    //     }

    //     const data = fs.readFileSync(counterFile, 'utf8'); // Synchronous read
    //     const counter = JSON.parse(data);
    //     return NextResponse.json(counter);
    // } catch (err) {
    //     console.error('Error reading counter file:', err);
    //     return NextResponse.json({ error: 'Error reading counter file' }, { status: 500 });
    // }
}