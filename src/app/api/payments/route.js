import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB (batas aman untuk server upload di Vercel)

// POST /api/payments — peserta upload/re-upload bukti pembayaran — FR-P5
// Body: multipart/form-data dengan field "registration_id" dan "file"
export async function POST(request) {
  const session = await requireRole(["participant"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const registrationId = formData.get("registration_id");
    const file = formData.get("file");

    if (!registrationId || !file) {
      return NextResponse.json(
        { error: "registration_id dan file wajib diisi" },
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

    // Pastikan registrasi ini benar-benar milik peserta yang sedang login
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

    // Upload ke Vercel Blob — store ini dikonfigurasi PRIVATE, jadi access harus 'private'.
    // File tidak bisa diakses langsung lewat URL; harus lewat /api/files/[...pathname] (lihat route itu).
    const blob = await put(`payments/${registrationId}-${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
      ...(process.env.BLOB_READ_WRITE_TOKEN
        ? { token: process.env.BLOB_READ_WRITE_TOKEN }
        : {}),
    });

    // Opsi B: INSERT kalau belum ada payment, atau UPDATE kalau re-upload (misal setelah ditolak)
    // Simpan blob.pathname (bukan blob.url) karena file private — URL asli tidak bisa diakses langsung.
    const [payment] = await sql`
      INSERT INTO payments (registration_id, payment_proof, status, submitted_at)
      VALUES (${registrationId}, ${blob.pathname}, 'pending', NOW())
      ON CONFLICT (registration_id)
      DO UPDATE SET
        payment_proof = EXCLUDED.payment_proof,
        status = 'pending',
        submitted_at = NOW(),
        verified_at = NULL
      RETURNING id, registration_id, payment_proof, status, submitted_at
    `;

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Upload payment error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// GET /api/payments — daftar payment untuk admin, default filter status=pending — FR-A4
export async function GET(request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // pending | approved | rejected | (kosong = semua)

  try {
    const payments = status
      ? await sql`
          SELECT p.id, p.registration_id, p.payment_proof, p.status, p.submitted_at, p.verified_at,
                 u.name AS user_name, u.email AS user_email,
                 e.title AS event_title
          FROM payments p
          JOIN registrations r ON r.id = p.registration_id
          JOIN users u ON u.id = r.user_id
          JOIN events e ON e.id = r.event_id
          WHERE p.status = ${status}
          ORDER BY p.submitted_at DESC
        `
      : await sql`
          SELECT p.id, p.registration_id, p.payment_proof, p.status, p.submitted_at, p.verified_at,
                 u.name AS user_name, u.email AS user_email,
                 e.title AS event_title
          FROM payments p
          JOIN registrations r ON r.id = p.registration_id
          JOIN users u ON u.id = r.user_id
          JOIN events e ON e.id = r.event_id
          ORDER BY p.submitted_at DESC
        `;

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
