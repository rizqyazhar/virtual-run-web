import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await sql`SELECT NOW()`;
  return NextResponse.json({ success: true, time: result[0] });
}
