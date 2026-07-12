import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// GET /api/events — daftar semua event (dipakai peserta browse event & admin dashboard)
export async function GET() {
  try {
    const events = await sql`
      SELECT id, title, description, distance, price, start_date, end_date, created_at
      FROM events
      ORDER BY start_date ASC
    `;
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Get events error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// POST /api/events — buat event baru (khusus admin) — FR-A2
export async function POST(request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    const { title, description, distance, price, start_date, end_date } =
      await request.json();

    if (!title || !distance || !start_date || !end_date) {
      return NextResponse.json(
        { error: "title, distance, start_date, end_date wajib diisi" },
        { status: 400 },
      );
    }
    if (new Date(end_date) < new Date(start_date)) {
      return NextResponse.json(
        { error: "end_date tidak boleh sebelum start_date" },
        { status: 400 },
      );
    }

    const [event] = await sql`
      INSERT INTO events (title, description, distance, price, start_date, end_date)
      VALUES (${title}, ${description ?? null}, ${distance}, ${price ?? 0}, ${start_date}, ${end_date})
      RETURNING id, title, description, distance, price, start_date, end_date, created_at
    `;

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
