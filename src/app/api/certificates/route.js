import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/certificate";

// POST /api/certificates — admin generate & aktifkan sertifikat — FR-A7
// Body: { "running_result_id": number }
// SYARAT: running_results.verification_status harus sudah 'approved'
export async function POST(request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    const { running_result_id } = await request.json();
    if (!running_result_id) {
      return NextResponse.json(
        { error: "running_result_id wajib diisi" },
        { status: 400 },
      );
    }

    // Ambil data lengkap yang dibutuhkan untuk isi sertifikat
    const [data] = await sql`
      SELECT rr.id, rr.distance, rr.finish_time, rr.verification_status,
             u.name AS participant_name,
             e.id AS event_id, e.title AS event_title
      FROM running_results rr
      JOIN registrations r ON r.id = rr.registration_id
      JOIN users u ON u.id = r.user_id
      JOIN events e ON e.id = r.event_id
      WHERE rr.id = ${running_result_id}
    `;

    if (!data) {
      return NextResponse.json(
        { error: "Hasil lari tidak ditemukan" },
        { status: 404 },
      );
    }
    if (data.verification_status !== "approved") {
      return NextResponse.json(
        {
          error:
            "Sertifikat hanya bisa diaktifkan untuk hasil lari yang sudah disetujui",
        },
        { status: 403 },
      );
    }

    // Hitung rank peserta ini di antara semua hasil approved pada event yang sama
    const rankedResults = await sql`
      SELECT rr.id, RANK() OVER (ORDER BY rr.finish_time ASC) AS rank
      FROM running_results rr
      JOIN registrations r ON r.id = rr.registration_id
      WHERE r.event_id = ${data.event_id} AND rr.verification_status = 'approved'
    `;
    const rankEntry = rankedResults.find(
      (r) => r.id === Number(running_result_id),
    );
    const rank = rankEntry ? Number(rankEntry.rank) : null;

    // Generate PDF real-time
    const pdfBytes = await generateCertificatePdf({
      participantName: data.participant_name,
      eventTitle: data.event_title,
      distance: data.distance,
      finishTime: data.finish_time,
      rank,
    });

    // Upload ke Blob (private, sama seperti file lain)
    const blob = await put(
      `certificates/${running_result_id}-certificate.pdf`,
      Buffer.from(pdfBytes),
      {
        access: "private",
        addRandomSuffix: true,
        contentType: "application/pdf",
        ...(process.env.BLOB_READ_WRITE_TOKEN
          ? { token: process.env.BLOB_READ_WRITE_TOKEN }
          : {}),
      },
    );

    // Simpan pathname ke kolom certificate_url (tanda sertifikat sudah "aktif")
    const [updated] = await sql`
      UPDATE running_results
      SET certificate_url = ${blob.pathname}
      WHERE id = ${running_result_id}
      RETURNING id, registration_id, certificate_url
    `;

    return NextResponse.json({ result: updated }, { status: 201 });
  } catch (error) {
    console.error("Generate certificate error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// GET /api/certificates — peserta lihat daftar sertifikat miliknya yang sudah aktif — FR-P8
export async function GET() {
  const session = await requireRole(["participant"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    const certificates = await sql`
      SELECT rr.id AS running_result_id, rr.certificate_url, rr.distance, rr.finish_time,
             e.title AS event_title
      FROM running_results rr
      JOIN registrations r ON r.id = rr.registration_id
      JOIN events e ON e.id = r.event_id
      WHERE r.user_id = ${session.id} AND rr.certificate_url IS NOT NULL
      ORDER BY rr.verified_at DESC
    `;

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error("Get certificates error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
