"use client";

import { useEffect, useState } from "react";
import { Target, CheckCircle2, Clock, Trophy, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { SummaryCard } from "@/components/SummaryCard";
import { Panel } from "@/components/Panel"; // [BARU]
import { formatInterval } from "@/lib/format";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Browse Events" },
  { href: "/dashboard/registrations", label: "My Registrations" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/certificates", label: "Certificates" },
];

const QUICK_ACTIONS = [
  { label: "Browse New Events", href: "/dashboard/events", primary: true },
  { label: "Upload Payment", href: "/dashboard/registrations" },
  { label: "Upload Result", href: "/dashboard/registrations" },
  { label: "View Leaderboard", href: "/dashboard/leaderboard" },
  { label: "My Certificates", href: "/dashboard/certificates" },
];

// [BARU] Batas jumlah item yang ditampilkan tiap panel sebelum tombol "Lihat Selengkapnya" muncul
const PREVIEW_LIMIT = 5;

function getStatusLabel(reg) {
  if (!reg.payment_status) return "Menunggu Pembayaran";
  if (reg.payment_status === "pending") return "Verifikasi Pembayaran";
  if (reg.payment_status === "rejected") return "Pembayaran Ditolak";
  if (!reg.result_status) return "Registered";
  if (reg.result_status === "pending") return "Verifikasi Hasil";
  if (reg.result_status === "rejected") return "Hasil Ditolak";
  return "Completed";
}

function statusBadgeColor(label) {
  if (label === "Completed") return "bg-green-100 text-green-700";
  if (label.includes("Ditolak")) return "bg-red-100 text-red-700";
  if (label.includes("Verifikasi")) return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
}

export default function ParticipantDashboardPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [results, setResults] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]); // [BARU]
  const [certificates, setCertificates] = useState([]); // [BARU]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [regRes, resultRes, eventsRes, leaderboardRes, certificatesRes] =
          await Promise.all([
            fetch("/api/registrations"),
            fetch("/api/running-results"),
            fetch("/api/events"),
            fetch("/api/leaderboard"), // [BARU]
            fetch("/api/certificates"), // [BARU]
          ]);
        const regData = await regRes.json();
        const resultData = await resultRes.json();
        const eventsData = await eventsRes.json();
        const leaderboardData = await leaderboardRes.json(); // [BARU]
        const certificatesData = await certificatesRes.json(); // [BARU]

        setRegistrations(regData.registrations || []);
        setResults(resultData.results || []);
        setLeaderboard(leaderboardData.leaderboard || []); // [BARU]
        setCertificates(certificatesData.certificates || []); // [BARU]

        const now = new Date();
        const upcoming = (eventsData.events || [])
          .filter((e) => new Date(e.start_date) > now)
          .slice(0, PREVIEW_LIMIT);
        setUpcomingEvents(upcoming);
      } catch (error) {
        console.error("Load dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const resultByRegistrationId = new Map(
    results.map((r) => [r.registration_id, r]),
  );

  const totalDistance = results
    .filter((r) => r.verification_status === "approved")
    .reduce((sum, r) => sum + parseFloat(r.distance || 0), 0);

  const completedCount = registrations.filter(
    (r) => r.result_status === "approved",
  ).length;
  const pendingCount = registrations.length - completedCount;

  // [BARU] Data yang dipotong sesuai PREVIEW_LIMIT untuk tiap panel
  const registrationsPreview = registrations.slice(0, PREVIEW_LIMIT);
  const leaderboardPreview = leaderboard.slice(0, PREVIEW_LIMIT);
  const certificatesPreview = certificates.slice(0, PREVIEW_LIMIT);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-7xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>
            Welcome, {user?.name || "…"}
          </h1>
          <p className='text-sm text-gray-500'>Participant</p>
        </div>

        {/* Summary cards — overview 4 modul utama */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          <SummaryCard
            label='Event Registered'
            value={registrations.length}
            icon={Target}
            color='blue'
          />
          <SummaryCard
            label='Completed'
            value={completedCount}
            icon={CheckCircle2}
            color='green'
          />
          <SummaryCard
            label='Pending'
            value={pendingCount}
            icon={Clock}
            color='orange'
          />
          <SummaryCard
            label='Total Distance'
            value={`${totalDistance.toFixed(1)} km`}
            icon={Trophy}
            color='gray'
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            {/* Modul: Registrasi + Pembayaran + Hasil Lari (status gabungan) */}
            <Panel
              title='My Recent Registrations'
              subtitle='Your running history'
              viewAllHref='/dashboard/registrations'
              hasMore={registrations.length > PREVIEW_LIMIT} // [BARU]
            >
              {loading ? (
                <p className='text-sm text-gray-400 py-8 text-center'>
                  Memuat data…
                </p>
              ) : registrations.length === 0 ? (
                <p className='text-sm text-gray-400 py-8 text-center'>
                  Belum ada registrasi. Yuk daftar event pertama Anda!
                </p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='bg-gray-50 text-left text-gray-500'>
                        <th className='py-2.5 px-3 font-medium rounded-l-lg'>
                          Event Name
                        </th>
                        <th className='py-2.5 px-3 font-medium'>Date</th>
                        <th className='py-2.5 px-3 font-medium'>Status</th>
                        <th className='py-2.5 px-3 font-medium rounded-r-lg'>
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrationsPreview.map((reg) => {
                        const result = resultByRegistrationId.get(reg.id);
                        const label = getStatusLabel(reg);
                        return (
                          <tr
                            key={reg.id}
                            className='border-b border-gray-100 last:border-0'>
                            <td className='py-3 px-3 text-gray-700 font-medium'>
                              {reg.event_title}
                            </td>
                            <td className='py-3 px-3 text-gray-500'>
                              {new Date(reg.start_date).toLocaleDateString(
                                "id-ID",
                              )}
                            </td>
                            <td className='py-3 px-3'>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeColor(label)}`}>
                                {label}
                              </span>
                            </td>
                            {/* [BERUBAH] pakai formatInterval, sebelumnya render object langsung (bug) */}
                            <td className='py-3 px-3 text-gray-500'>
                              {formatInterval(result?.finish_time)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel
              title='Leaderboard'
              subtitle='Peringkat terbaik dari semua event'
              viewAllHref='/dashboard/leaderboard'
              hasMore={leaderboard.length > PREVIEW_LIMIT}>
              {loading ? (
                <p className='text-sm text-gray-400 py-8 text-center'>
                  Memuat data…
                </p>
              ) : leaderboardPreview.length === 0 ? (
                <p className='text-sm text-gray-400 py-8 text-center'>
                  Belum ada hasil lari yang terverifikasi.
                </p>
              ) : (
                <div className='space-y-2'>
                  {leaderboardPreview.map((entry, idx) => (
                    <div
                      key={`${entry.event_id}-${entry.user_id}`}
                      className='flex items-center justify-between border border-gray-100 rounded-xl px-4 py-2.5'>
                      <div className='flex items-center gap-3'>
                        <span className='w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600'>
                          {entry.rank ?? idx + 1}
                        </span>
                        <div>
                          <p className='text-sm text-gray-700 font-medium'>
                            {entry.user_name}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {entry.event_title}
                          </p>
                        </div>
                      </div>
                      <span className='text-sm font-mono text-gray-600'>
                        {formatInterval(entry.finish_time)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Sidebar kanan */}
          <div className='space-y-6'>
            <div className='bg-white rounded-2xl border border-gray-200 p-6'>
              <h2 className='text-lg text-gray-900 font-bold mb-4'>
                Quick Actions
              </h2>
              <div className='space-y-2'>
                {QUICK_ACTIONS.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className={`block text-center text-sm font-medium py-2.5 rounded-lg transition-colors ${
                      action.primary
                        ? "bg-black text-white hover:bg-gray-800"
                        : "border border-gray-200 hover:bg-gray-50 text-gray-500"
                    }`}>
                    {action.label}
                  </a>
                ))}
              </div>
            </div>

            <Panel
              title='My Certificates'
              viewAllHref='/dashboard/certificates'
              hasMore={certificates.length > PREVIEW_LIMIT}>
              {loading ? (
                <p className='text-sm text-gray-400 py-4 text-center'>
                  Memuat…
                </p>
              ) : certificatesPreview.length === 0 ? (
                <p className='text-sm text-gray-400 py-4 text-center'>
                  Belum ada sertifikat aktif.
                </p>
              ) : (
                <div className='space-y-2'>
                  {certificatesPreview.map((cert) => (
                    <div
                      key={cert.running_result_id}
                      className='flex items-center gap-3 border border-gray-100 rounded-xl p-3'>
                      <div className='w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0'>
                        <Award className='w-4.5 h-4.5' strokeWidth={1.75} />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-sm text-gray-500 font-medium truncate'>
                          {cert.event_title}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {cert.distance} km
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title='Upcoming Events' hasMore={false}>
              {upcomingEvents.length === 0 ? (
                <p className='text-sm text-gray-400'>
                  Belum ada event mendatang.
                </p>
              ) : (
                <div className='space-y-3'>
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className='border border-gray-100 rounded-xl p-3'>
                      <p className='font-medium text-sm text-gray-700'>
                        {event.title}
                      </p>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        {new Date(event.start_date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
