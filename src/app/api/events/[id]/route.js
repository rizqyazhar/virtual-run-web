import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// GET /api/events/:id — detail 1 event
export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const [event] = await sql`
      SELECT id, title, description, distance, price, start_date, end_date, created_at
      FROM events
      WHERE id = ${id}
    `;

    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Get event detail error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// PUT /api/events/:id — update event (khusus admin) — FR-A2
export async function PUT(request, { params }) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { id } = await params;

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
      UPDATE events
      SET title = ${title},
          description = ${description ?? null},
          distance = ${distance},
          price = ${price ?? 0},
          start_date = ${start_date},
          end_date = ${end_date}
      WHERE id = ${id}
      RETURNING id, title, description, distance, price, start_date, end_date, created_at
    `;

    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// DELETE /api/events/:id — hapus event (khusus admin) — FR-A2
export async function DELETE(request, { params }) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const [deleted] = await sql`
      DELETE FROM events WHERE id = ${id} RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
