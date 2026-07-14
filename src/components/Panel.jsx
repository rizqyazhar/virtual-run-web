import Link from "next/link";

// Komponen ini dipakai supaya setiap panel modul (Registrasi, Payment, Leaderboard, dst)
// di dashboard punya struktur konsisten: judul + subjudul + tombol "Lihat Selengkapnya"
// yang cuma muncul kalau data-nya melebihi batas tampil (hasMore).
export function Panel({ title, subtitle, viewAllHref, hasMore, children }) {
  return (
    <div className='bg-white rounded-2xl border border-gray-200 p-6'>
      <div className='flex items-start justify-between mb-4'>
        <div>
          <h2 className='text-lg text-gray-900 font-bold'>{title}</h2>
          {subtitle && <p className='text-sm text-gray-500'>{subtitle}</p>}
        </div>
        {/* Tombol "Lihat Selengkapnya" cuma tampil kalau data lebih banyak dari yang ditampilkan */}
        {hasMore && viewAllHref && (
          <Link
            href={viewAllHref}
            className='text-xs font-semibold text-gray-600 hover:text-black transition-colors whitespace-nowrap'>
            Lihat Selengkapnya →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
