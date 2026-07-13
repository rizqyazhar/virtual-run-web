import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

// POST /api/registrations — peserta daftar ke sebuah event — FR-P4
export async function POST(request) {
  const session = await requireRole(["participant"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    const { event_id } = await request.json();
    if (!event_id) {
      return NextResponse.json(
        { error: "event_id wajib diisi" },
        { status: 400 },
      );
    }

    // Pastikan event-nya benar-benar ada
    const [event] = await sql`SELECT id FROM events WHERE id = ${event_id}`;
    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 },
      );
    }

    // Cegah daftar dua kali ke event yang sama (juga dijaga oleh UNIQUE constraint di DB)
    const [existing] = await sql`
      SELECT id FROM registrations
      WHERE user_id = ${session.id} AND event_id = ${event_id}
    `;
    if (existing) {
      return NextResponse.json(
        { error: "Anda sudah terdaftar di event ini" },
        { status: 409 },
      );
    }

    const [registration] = await sql`
      INSERT INTO registrations (user_id, event_id)
      VALUES (${session.id}, ${event_id})
      RETURNING id, user_id, event_id, registration_date
    `;

    // Belum ada baris di payments sama sekali (Opsi B) —
    // status "Menunggu Pembayaran" disimpulkan dari TIDAK ADANYA baris payment.
    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    console.error("Create registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// GET /api/registrations — daftar registrasi
//   - Peserta: hanya miliknya sendiri (FR-P.. "My Registrations")
//   - Admin: bisa semua, atau filter ?event_id=... (FR-A3 "Kelola Peserta per event")
export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const eventIdFilter = searchParams.get("event_id");

  try {
    let registrations;

    if (session.role === "admin") {
      registrations = eventIdFilter
        ? await sql`
            SELECT r.id, r.registration_date,
                   u.id AS user_id, u.name AS user_name, u.email AS user_email,
                   e.id AS event_id, e.title AS event_title,
                   p.status AS payment_status,
                   rr.verification_status AS result_status
            FROM registrations r
            JOIN users u ON u.id = r.user_id
            JOIN events e ON e.id = r.event_id
            LEFT JOIN payments p ON p.registration_id = r.id
            LEFT JOIN running_results rr ON rr.registration_id = r.id
            WHERE r.event_id = ${eventIdFilter}
            ORDER BY r.registration_date DESC
          `
        : await sql`
            SELECT r.id, r.registration_date,
                   u.id AS user_id, u.name AS user_name, u.email AS user_email,
                   e.id AS event_id, e.title AS event_title,
                   p.status AS payment_status,
                   rr.verification_status AS result_status
            FROM registrations r
            JOIN users u ON u.id = r.user_id
            JOIN events e ON e.id = r.event_id
            LEFT JOIN payments p ON p.registration_id = r.id
            LEFT JOIN running_results rr ON rr.registration_id = r.id
            ORDER BY r.registration_date DESC
          `;
    } else {
      // Peserta hanya lihat miliknya sendiri
      registrations = await sql`
        SELECT r.id, r.registration_date,
               e.id AS event_id, e.title AS event_title, e.start_date, e.end_date,
               p.status AS payment_status,
               rr.verification_status AS result_status
        FROM registrations r
        JOIN events e ON e.id = r.event_id
        LEFT JOIN payments p ON p.registration_id = r.id
        LEFT JOIN running_results rr ON rr.registration_id = r.id
        WHERE r.user_id = ${session.id}
        ORDER BY r.registration_date DESC
      `;
    }

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error("Get registrations error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
