import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const counterFile = path.join(process.cwd(), 'counter.json'); // adjust path as needed

export async function GET() {
    try {
        if (!fs.existsSync(counterFile)) {
            return NextResponse.json({ error: 'Counter file not found' }, { status: 404 });
        }

        const data = fs.readFileSync(counterFile, 'utf8'); // Synchronous read
        const counter = JSON.parse(data);
        return NextResponse.json(counter);
    } catch (err) {
        console.error('Error reading counter file:', err);
        return NextResponse.json({ error: 'Error reading counter file' }, { status: 500 });
    }
}