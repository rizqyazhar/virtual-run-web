"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { SummaryCard } from "@/components/SummaryCard";
import { Panel } from "@/components/Panel"; // [BARU]

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Event Management" },
  { href: "/admin/payments", label: "Payment Verification" },
  { href: "/admin/results", label: "Results Verification" },
];

// [BARU] Batas jumlah item yang ditampilkan tiap panel sebelum tombol "Lihat Selengkapnya" muncul
const PREVIEW_LIMIT = 5;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingResults, setPendingResults] = useState([]);
  const [approvedPaymentsCount, setApprovedPaymentsCount] = useState(0);
  const [approvedResultsCount, setApprovedResultsCount] = useState(0);
  const [certificates, setCertificates] = useState([]); // [BARU]
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      // [BERUBAH] tambah fetch certificates untuk panel "Recently Issued Certificates"
      const [
        eventsRes,
        regRes,
        pendingPayRes,
        approvedPayRes,
        pendingResRes,
        approvedResRes,
        certificatesRes, // [BARU]
      ] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/registrations"),
        fetch("/api/payments?status=pending"),
        fetch("/api/payments?status=approved"),
        fetch("/api/running-results?status=pending"),
        fetch("/api/running-results?status=approved"),
        fetch("/api/certificates"), // [BARU]
      ]);

      setEvents((await eventsRes.json()).events || []);
      setRegistrations((await regRes.json()).registrations || []);
      setPendingPayments((await pendingPayRes.json()).payments || []);
      setApprovedPaymentsCount(
        ((await approvedPayRes.json()).payments || []).length,
      );
      setPendingResults((await pendingResRes.json()).results || []);
      setApprovedResultsCount(
        ((await approvedResRes.json()).results || []).length,
      );
      setCertificates((await certificatesRes.json()).certificates || []); // [BARU]
    } catch (error) {
      console.error("Load admin dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleApprove(type, id) {
    setActingId(`${type}-${id}`);
    try {
      const endpoint =
        type === "payment"
          ? `/api/payments/${id}`
          : `/api/running-results/${id}`;
      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      await loadData();
    } catch (error) {
      console.error("Approve error:", error);
    } finally {
      setActingId(null);
    }
  }

  const participantsCount = new Set(registrations.map((r) => r.user_id)).size;
  const verifiedSubmissions = approvedPaymentsCount + approvedResultsCount;
  const pendingVerifications = pendingPayments.length + pendingResults.length;

  const registrationCountByEvent = registrations.reduce((acc, r) => {
    acc[r.event_id] = (acc[r.event_id] || 0) + 1;
    return acc;
  }, {});

  // [BARU] Data dipotong sesuai PREVIEW_LIMIT untuk tiap panel
  const eventsPreview = events.slice(0, PREVIEW_LIMIT);
  const pendingPaymentsPreview = pendingPayments.slice(0, PREVIEW_LIMIT);
  const pendingResultsPreview = pendingResults.slice(0, PREVIEW_LIMIT);
  const certificatesPreview = certificates.slice(0, PREVIEW_LIMIT);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-7xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>
            Welcome, {user?.name || "Admin"}
          </h1>
          <p className='text-sm text-gray-500'>
            Ringkasan aktivitas event Virtual Run Anda
          </p>
        </div>

        {/* Summary cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          <SummaryCard
            label='Total Events'
            value={events.length}
            icon={Calendar}
            color='blue'
          />
          <SummaryCard
            label='Active Participants'
            value={participantsCount}
            icon={Users}
            color='green'
          />
          <SummaryCard
            label='Verified Submissions'
            value={verifiedSubmissions}
            icon={CheckCircle2}
            color='purple'
          />
          <SummaryCard
            label='Pending Verifications'
            value={pendingVerifications}
            icon={AlertCircle}
            color='red'
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Modul: Event Management */}
          <Panel
            title='Recent Events'
            subtitle='Upcoming and completed events'
            viewAllHref='/admin/events'
            hasMore={events.length > PREVIEW_LIMIT} // [BARU]
          >
            {loading ? (
              <p className='text-sm text-gray-400 py-8 text-center'>
                Memuat data…
              </p>
            ) : events.length === 0 ? (
              <p className='text-sm text-gray-400 py-8 text-center'>
                Belum ada event. Buat event pertama Anda.
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-50 text-left text-gray-500'>
                      <th className='py-2.5 px-3 font-medium rounded-l-lg'>
                        Event Name
                      </th>
                      <th className='py-2.5 px-3 font-medium'>Participants</th>
                      <th className='py-2.5 px-3 font-medium rounded-r-lg'>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventsPreview.map((event) => {
                      const isActive = new Date(event.end_date) >= new Date();
                      return (
                        <tr
                          key={event.id}
                          className='border-b border-gray-100 last:border-0'>
                          <td className='py-3 px-3 font-medium'>
                            {event.title}
                          </td>
                          <td className='py-3 px-3 text-gray-500'>
                            {registrationCountByEvent[event.id] || 0}
                          </td>
                          <td className='py-3 px-3'>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                              {isActive ? "Active" : "Completed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* [BERUBAH] Modul: Pembayaran — dipisah dari Hasil Lari (sebelumnya digabung 1 panel "Pending Verifications") */}
          <Panel
            title='Pending Payments'
            subtitle='Bukti pembayaran menunggu verifikasi'
            viewAllHref='/admin/payments'
            hasMore={pendingPayments.length > PREVIEW_LIMIT}>
            {loading ? (
              <p className='text-sm text-gray-400 py-8 text-center'>
                Memuat data…
              </p>
            ) : pendingPaymentsPreview.length === 0 ? (
              <p className='text-sm text-gray-400 py-8 text-center'>
                Tidak ada pembayaran yang menunggu. 🎉
              </p>
            ) : (
              <div className='space-y-3'>
                {pendingPaymentsPreview.map((item) => (
                  <div
                    key={item.id}
                    className='border border-gray-100 rounded-xl p-4'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <p className='font-medium text-sm'>{item.user_name}</p>
                        <p className='text-xs text-gray-500'>
                          {item.event_title}
                        </p>
                        <p className='text-xs text-gray-400 mt-0.5'>
                          Submitted:{" "}
                          {new Date(item.submitted_at).toLocaleDateString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-2 justify-end'>
                      <button
                        type='button'
                        onClick={() => handleApprove("payment", item.id)}
                        disabled={actingId === `payment-${item.id}`}
                        className='bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors'>
                        {actingId === `payment-${item.id}`
                          ? "Memproses…"
                          : "Approve"}
                      </button>
                      <a
                        href='/admin/payments'
                        className='border border-gray-200 hover:bg-gray-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors'>
                        Review
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* [BERUBAH] Modul: Hasil Lari — panel terpisah sendiri (sebelumnya digabung dengan payment) */}
          <Panel
            title='Pending Results'
            subtitle='Hasil lari menunggu verifikasi'
            viewAllHref='/admin/results'
            hasMore={pendingResults.length > PREVIEW_LIMIT}>
            {loading ? (
              <p className='text-sm text-gray-400 py-8 text-center'>
                Memuat data…
              </p>
            ) : pendingResultsPreview.length === 0 ? (
              <p className='text-sm text-gray-400 py-8 text-center'>
                Tidak ada hasil lari yang menunggu. 🎉
              </p>
            ) : (
              <div className='space-y-3'>
                {pendingResultsPreview.map((item) => (
                  <div
                    key={item.id}
                    className='border border-gray-100 rounded-xl p-4'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <p className='font-medium text-sm'>{item.user_name}</p>
                        <p className='text-xs text-gray-500'>
                          {item.event_title}
                        </p>
                        <p className='text-xs text-gray-400 mt-0.5'>
                          Submitted:{" "}
                          {new Date(item.submitted_at).toLocaleDateString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-2 justify-end'>
                      <button
                        type='button'
                        onClick={() => handleApprove("result", item.id)}
                        disabled={actingId === `result-${item.id}`}
                        className='bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors'>
                        {actingId === `result-${item.id}`
                          ? "Memproses…"
                          : "Approve"}
                      </button>
                      <a
                        href='/admin/results'
                        className='border border-gray-200 hover:bg-gray-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors'>
                        Review
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* [BARU] Modul: Sertifikat */}
          <Panel
            title='Recently Issued Certificates'
            subtitle='Sertifikat yang sudah diaktifkan'
            viewAllHref='/admin/certificates'
            hasMore={certificates.length > PREVIEW_LIMIT}>
            {loading ? (
              <p className='text-sm text-gray-400 py-8 text-center'>
                Memuat data…
              </p>
            ) : certificatesPreview.length === 0 ? (
              <p className='text-sm text-gray-400 py-8 text-center'>
                Belum ada sertifikat yang diaktifkan.
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
                      <p className='text-sm font-medium truncate'>
                        {cert.participant_name}
                      </p>
                      <p className='text-xs text-gray-500 truncate'>
                        {cert.event_title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </main>
    </div>
  );
}
