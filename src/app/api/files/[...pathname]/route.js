import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";

// GET /api/files/:pathname* — proxy untuk menampilkan file private dari Vercel Blob
// Dipakai sebagai src <img> di frontend, contoh: /api/files/payments/1-bukti-abc123.jpg
//
// Catatan: saat ini otorisasi cuma cek "sudah login atau belum" (admin maupun peserta manapun).
// Untuk keamanan lebih ketat (misal peserta hanya boleh lihat file miliknya sendiri),
// perlu tambahan query ke tabel payments/running_results untuk cek kepemilikan —
// bisa ditambahkan nanti kalau dibutuhkan.
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { pathname } = await params;
  const fullPathname = pathname.join("/");

  try {
    const result = await get(fullPathname, {
      access: "private",
      ...(process.env.BLOB_READ_WRITE_TOKEN
        ? { token: process.env.BLOB_READ_WRITE_TOKEN }
        : {}),
    });

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json(
      { error: "File tidak ditemukan" },
      { status: 404 },
    );
  }
}
