"use client";

import { useEffect, useState, useCallback } from "react";
import { Award } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatInterval } from "@/lib/format";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Event Management" },
  { href: "/admin/payments", label: "Payment Verification" },
  { href: "/admin/results", label: "Results Verification" },
  { href: "/admin/certificates", label: "Certificates" },
];

const FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "Semua" },
];

function statusBadgeColor(status) {
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-orange-100 text-orange-700";
}

export default function AdminResultsPage() {
  const [filter, setFilter] = useState("pending");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [certifyingId, setCertifyingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/running-results${query}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Load results error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  async function handleVerify(id, status) {
    setActingId(id);
    try {
      await fetch(`/api/running-results/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadResults();
    } catch (err) {
      console.error("Verify result error:", err);
    } finally {
      setActingId(null);
    }
  }

  async function handleActivateCertificate(runningResultId) {
    setCertifyingId(runningResultId);
    try {
      await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ running_result_id: runningResultId }),
      });
      await loadResults();
    } catch (err) {
      console.error("Activate certificate error:", err);
    } finally {
      setCertifyingId(null);
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-7xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>
            Results Verification
          </h1>
          <p className='text-sm text-gray-500'>Verifikasi hasil lari peserta</p>
        </div>

        <div className='flex gap-2 mb-6'>
          {FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              type='button'
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                filter === f.value
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className='bg-white rounded-2xl border border-gray-200 p-6'>
          {loading ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Memuat data…
            </p>
          ) : results.length === 0 ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Tidak ada data hasil lari.
            </p>
          ) : (
            <div className='space-y-3'>
              {results.map((result) => (
                <div
                  key={result.id}
                  className='flex flex-col sm:flex-row sm:items-center gap-4 border border-gray-100 rounded-xl p-4'>
                  <button
                    type='button'
                    onClick={() =>
                      setPreviewUrl(`/api/files/${result.screenshot}`)
                    }
                    className='shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/files/${result.screenshot}`}
                      alt='Screenshot hasil lari'
                      className='w-full h-full object-cover'
                    />
                  </button>

                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-sm text-gray-700'>
                      {result.user_name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {result.event_title}
                    </p>
                    <p className='text-xs text-gray-500 font-mono mt-1'>
                      {result.distance} km ·{" "}
                      {formatInterval(result.finish_time)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadgeColor(
                      result.verification_status,
                    )}`}>
                    {result.verification_status}
                  </span>

                  {result.verification_status === "pending" && (
                    <div className='flex gap-2 shrink-0'>
                      <button
                        type='button'
                        onClick={() => handleVerify(result.id, "approved")}
                        disabled={actingId === result.id}
                        className='bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors'>
                        {actingId === result.id ? "…" : "Approve"}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleVerify(result.id, "rejected")}
                        disabled={actingId === result.id}
                        className='border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 text-xs text-gray-500 font-medium px-4 py-2 rounded-lg transition-colors'>
                        Reject
                      </button>
                    </div>
                  )}

                  {result.verification_status === "approved" &&
                    !result.certificate_url && (
                      <button
                        type='button'
                        onClick={() => handleActivateCertificate(result.id)}
                        disabled={certifyingId === result.id}
                        className='shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors'>
                        <Award className='w-3.5 h-3.5' />
                        {certifyingId === result.id
                          ? "Memproses…"
                          : "Aktifkan Sertifikat"}
                      </button>
                    )}

                  {result.verification_status === "approved" &&
                    result.certificate_url && (
                      <span className='shrink-0 text-xs text-green-700 font-medium flex items-center gap-1.5'>
                        <Award className='w-3.5 h-3.5' />
                        Sertifikat Aktif
                      </span>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {previewUrl && (
        <div
          className='fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50'
          onClick={() => setPreviewUrl(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt='Screenshot hasil lari'
            className='max-w-full max-h-full rounded-lg'
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
