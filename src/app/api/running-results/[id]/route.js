import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// PATCH /api/running-results/:id — admin approve/reject hasil lari — FR-A5
// Body: { "status": "approved" | "rejected" }
export async function PATCH(request, { params }) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { status } = await request.json();
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status harus 'approved' atau 'rejected'" },
        { status: 400 },
      );
    }

    const [result] = await sql`
      UPDATE running_results
      SET verification_status = ${status}, verified_at = NOW()
      WHERE id = ${id}
      RETURNING id, registration_id, distance, finish_time, screenshot,
                verification_status, submitted_at, verified_at
    `;

    if (!result) {
      return NextResponse.json(
        { error: "Hasil lari tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Verify running result error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
