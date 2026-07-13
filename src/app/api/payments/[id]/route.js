import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// PATCH /api/payments/:id — admin approve/reject bukti pembayaran — FR-A4
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

    const [payment] = await sql`
      UPDATE payments
      SET status = ${status}, verified_at = NOW()
      WHERE id = ${id}
      RETURNING id, registration_id, payment_proof, status, submitted_at, verified_at
    `;

    if (!payment) {
      return NextResponse.json(
        { error: "Payment tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
