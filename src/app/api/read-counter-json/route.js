export const runtime = 'nodejs'
import { NextResponse } from "next/server";
import db from "@/lib/db";


export async function GET(req) {
    const email = req.nextUrl.searchParams.get('email'); // Correctly extract the emai  l
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
        
        // Return the email in the response
        return NextResponse.json(counter);
    } catch (err) {
        console.error('Error in fetching the counter data:', err);
        return NextResponse.json({ error: 'Error in fetching the counter data' }, { status: 500 });
    }
}