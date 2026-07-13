import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/leaderboard?event_id=... — ranking peserta berdasarkan hasil lari terverifikasi — FR-P7, FR-A6
// Bisa diakses admin maupun peserta (keduanya boleh lihat leaderboard).
// Kalau event_id tidak diisi, tampilkan leaderboard gabungan semua event.
export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");

  try {
    const leaderboard = eventId
      ? await sql`
          SELECT
            u.id AS user_id, u.name AS user_name,
            e.id AS event_id, e.title AS event_title,
            rr.distance, rr.finish_time, rr.submitted_at,
            RANK() OVER (ORDER BY rr.finish_time ASC) AS rank
          FROM running_results rr
          JOIN registrations r ON r.id = rr.registration_id
          JOIN users u ON u.id = r.user_id
          JOIN events e ON e.id = r.event_id
          WHERE rr.verification_status = 'approved' AND e.id = ${eventId}
          ORDER BY rr.finish_time ASC
        `
      : await sql`
          SELECT
            u.id AS user_id, u.name AS user_name,
            e.id AS event_id, e.title AS event_title,
            rr.distance, rr.finish_time, rr.submitted_at,
            RANK() OVER (PARTITION BY e.id ORDER BY rr.finish_time ASC) AS rank
          FROM running_results rr
          JOIN registrations r ON r.id = rr.registration_id
          JOIN users u ON u.id = r.user_id
          JOIN events e ON e.id = r.event_id
          WHERE rr.verification_status = 'approved'
          ORDER BY e.id, rr.finish_time ASC
        `;

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
