import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload;
    } catch {
      session = null;
    }
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isParticipantRoute = pathname.startsWith("/dashboard");

  // Belum login tapi akses route yang butuh auth
  if ((isAdminRoute || isParticipantRoute) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sudah login tapi role tidak sesuai
  if (isAdminRoute && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isParticipantRoute && session?.role !== "participant") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
