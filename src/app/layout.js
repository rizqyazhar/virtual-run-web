import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Virtual Run - Event Management",
  description: "Sistem terintegrasi manajemen event Virtual Run",
};

export default function RootLayout({ children }) {
  return (
    <html lang='id'>
      <body
        className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
