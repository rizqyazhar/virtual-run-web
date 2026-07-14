"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, UserCircle, LogOut, Trophy, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Navbar({ links }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className='sticky top-0 max-w-7xl mx-auto px-6 py-4 bg-white/30 backdrop-blur-md'>
      <div className='flex items-center justify-between'>
        <Link
          href='/'
          className='flex items-center gap-2.5'
          onClick={() => setMenuOpen(false)}>
          <div className='w-9 h-9 rounded-lg bg-black flex items-center justify-center'>
            <Trophy className='w-4.5 h-4.5 text-white' strokeWidth={1.75} />
          </div>
          <span className='text-lg text-gray-900 font-bold'>Virtual Run</span>
        </Link>

        {/* Nav pill — desktop only */}
        <nav className='hidden lg:flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1.5'>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative px-4 py-1.5 text-sm rounded-full transition-colors ${
                  isActive
                    ? "text-black font-medium"
                    : "text-gray-500 hover:text-gray-800"
                }`}>
                {link.label}
                {isActive && (
                  <span className='absolute left-4 right-4 -bottom-0.5 h-0.5 bg-orange-400 rounded-full' />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Ikon aksi — desktop only */}
        <div className='hidden lg:flex items-center gap-4 text-gray-500'>
          <button
            type='button'
            className='hover:text-black transition-colors'
            aria-label='Notifikasi'>
            <Bell className='w-5 h-5' strokeWidth={1.75} />
          </button>
          <button
            type='button'
            className='hover:text-black transition-colors'
            aria-label='Profil'>
            <UserCircle className='w-5 h-5' strokeWidth={1.75} />
          </button>
          <button
            type='button'
            onClick={handleLogout}
            className='hover:text-black transition-colors'
            aria-label='Logout'>
            <LogOut className='w-5 h-5' strokeWidth={1.75} />
          </button>
        </div>

        {/* Tombol hamburger — mobile & tablet only */}
        <button
          type='button'
          onClick={() => setMenuOpen((v) => !v)}
          className='lg:hidden p-2 -mr-2 text-gray-700 hover:text-black transition-colors'
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}>
          {menuOpen ? (
            <X className='w-6 h-6' strokeWidth={1.75} />
          ) : (
            <Menu className='w-6 h-6' strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Panel menu mobile & tablet */}
      {menuOpen && (
        <div className='lg:hidden fixed top-full translate-y-2.5 inset-x-1/2 -translate-x-1/2 md:inset-x-0 md:translate-x-5/6 w-sm rounded-2xl border border-gray-200 bg-white overflow-hidden'>
          <nav className='flex flex-col divide-y divide-gray-100'>
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-5 py-3.5 text-sm transition-colors ${
                    isActive
                      ? "text-black font-medium bg-gray-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className='flex items-center justify-around border-t border-gray-100 py-3 text-gray-500'>
            <button
              type='button'
              className='flex flex-col items-center gap-1 text-xs hover:text-black transition-colors'>
              <Bell className='w-5 h-5' strokeWidth={1.75} />
              Notifikasi
            </button>
            <button
              type='button'
              className='flex flex-col items-center gap-1 text-xs hover:text-black transition-colors'>
              <UserCircle className='w-5 h-5' strokeWidth={1.75} />
              Profil
            </button>
            <button
              type='button'
              onClick={handleLogout}
              className='flex flex-col items-center gap-1 text-xs hover:text-black transition-colors'>
              <LogOut className='w-5 h-5' strokeWidth={1.75} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
