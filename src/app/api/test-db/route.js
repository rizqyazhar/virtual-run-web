import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'`;
  return NextResponse.json({ tables });
}
