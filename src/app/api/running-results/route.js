import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

// POST /api/running-results — peserta upload hasil lari — FR-P6
// Body: multipart/form-data dengan field: registration_id, distance, finish_time (format "HH:MM:SS"), file
// SYARAT: status pembayaran untuk registration_id itu harus sudah 'approved'
export async function POST(request) {
  const session = await requireRole(["participant"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const registrationId = formData.get("registration_id");
    const distance = formData.get("distance");
    const finishTime = formData.get("finish_time"); // contoh: "01:23:45"
    const file = formData.get("file");

    if (!registrationId || !distance || !finishTime || !file) {
      return NextResponse.json(
        {
          error: "registration_id, distance, finish_time, dan file wajib diisi",
        },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File harus berupa gambar (jpg, png, atau webp)" },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 4MB" },
        { status: 400 },
      );
    }

    // Pastikan registrasi ini milik peserta yang login
    const [registration] = await sql`
      SELECT id FROM registrations
      WHERE id = ${registrationId} AND user_id = ${session.id}
    `;
    if (!registration) {
      return NextResponse.json(
        { error: "Registrasi tidak ditemukan atau bukan milik Anda" },
        { status: 404 },
      );
    }

    // SYARAT UTAMA FR-P6: payment harus sudah approved
    const [payment] = await sql`
      SELECT status FROM payments WHERE registration_id = ${registrationId}
    `;
    if (!payment || payment.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "Upload hasil lari hanya bisa dilakukan setelah pembayaran disetujui admin",
        },
        { status: 403 },
      );
    }

    // Upload screenshot ke Vercel Blob (private, sama seperti payment)
    const blob = await put(
      `running-results/${registrationId}-${file.name}`,
      file,
      {
        access: "private",
        addRandomSuffix: true,
        ...(process.env.BLOB_READ_WRITE_TOKEN
          ? { token: process.env.BLOB_READ_WRITE_TOKEN }
          : {}),
      },
    );

    // Upsert: peserta boleh upload ulang (misal hasil sebelumnya ditolak admin)
    const [result] = await sql`
      INSERT INTO running_results (registration_id, distance, finish_time, screenshot, verification_status, submitted_at)
      VALUES (${registrationId}, ${distance}, ${finishTime}::interval, ${blob.pathname}, 'pending', NOW())
      ON CONFLICT (registration_id)
      DO UPDATE SET
        distance = EXCLUDED.distance,
        finish_time = EXCLUDED.finish_time,
        screenshot = EXCLUDED.screenshot,
        verification_status = 'pending',
        submitted_at = NOW(),
        verified_at = NULL,
        certificate_url = NULL
      RETURNING id, registration_id, distance, finish_time, screenshot, verification_status, submitted_at
    `;

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    console.error("Upload running result error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// GET /api/running-results — admin list (filter ?status=pending), atau peserta lihat miliknya sendiri — FR-A5
export async function GET(request) {
  const session = await requireRole(["admin", "participant"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    let results;

    if (session.role === "admin") {
      results = status
        ? await sql`
            SELECT rr.id, rr.registration_id, rr.distance, rr.finish_time, rr.screenshot,
                   rr.verification_status, rr.certificate_url, rr.submitted_at, rr.verified_at,
                   u.name AS user_name, u.email AS user_email,
                   e.title AS event_title
            FROM running_results rr
            JOIN registrations r ON r.id = rr.registration_id
            JOIN users u ON u.id = r.user_id
            JOIN events e ON e.id = r.event_id
            WHERE rr.verification_status = ${status}
            ORDER BY rr.submitted_at DESC
          `
        : await sql`
            SELECT rr.id, rr.registration_id, rr.distance, rr.finish_time, rr.screenshot,
                   rr.verification_status, rr.certificate_url, rr.submitted_at, rr.verified_at,
                   u.name AS user_name, u.email AS user_email,
                   e.title AS event_title
            FROM running_results rr
            JOIN registrations r ON r.id = rr.registration_id
            JOIN users u ON u.id = r.user_id
            JOIN events e ON e.id = r.event_id
            ORDER BY rr.submitted_at DESC
          `;
    } else {
      results = await sql`
        SELECT rr.id, rr.registration_id, rr.distance, rr.finish_time, rr.screenshot,
               rr.verification_status, rr.certificate_url, rr.submitted_at, rr.verified_at,
               e.title AS event_title
        FROM running_results rr
        JOIN registrations r ON r.id = rr.registration_id
        JOIN events e ON e.id = r.event_id
        WHERE r.user_id = ${session.id}
        ORDER BY rr.submitted_at DESC
      `;
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Get running results error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
