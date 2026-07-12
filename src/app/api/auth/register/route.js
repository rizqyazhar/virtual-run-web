import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validasi input dasar
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi" },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 },
      );
    }

    // Cek email sudah terdaftar atau belum
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 },
      );
    }

    // Hash password lalu simpan user baru (role default: participant)
    const passwordHash = await hashPassword(password);
    const [newUser] = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, 'participant')
      RETURNING id, name, email, role
    `;

    // Langsung login setelah registrasi berhasil
    const token = await createSessionToken({
      id: newUser.id,
      role: newUser.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
