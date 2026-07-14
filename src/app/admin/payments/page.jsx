"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";

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

export default function AdminPaymentsPage() {
  const [filter, setFilter] = useState("pending");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // untuk modal lihat gambar full

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/payments${query}`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Load payments error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  async function handleVerify(id, status) {
    setActingId(id);
    try {
      await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadPayments();
    } catch (err) {
      console.error("Verify payment error:", err);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-7xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>
            Payment Verification
          </h1>
          <p className='text-sm text-gray-500'>
            Verifikasi bukti pembayaran peserta
          </p>
        </div>

        {/* Filter tabs */}
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
          ) : payments.length === 0 ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Tidak ada data pembayaran.
            </p>
          ) : (
            <div className='space-y-3'>
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className='flex flex-col sm:flex-row sm:items-center gap-4 border border-gray-100 rounded-xl p-4'>
                  {/* Thumbnail bukti bayar — pakai proxy /api/files karena file private */}
                  <button
                    type='button'
                    onClick={() =>
                      setPreviewUrl(`/api/files/${payment.payment_proof}`)
                    }
                    className='shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/files/${payment.payment_proof}`}
                      alt='Bukti pembayaran'
                      className='w-full h-full object-cover'
                    />
                  </button>

                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-sm text-gray-700'>
                      {payment.user_name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {payment.event_title}
                    </p>
                    <p className='text-xs text-gray-400 mt-0.5'>
                      Submitted:{" "}
                      {new Date(payment.submitted_at).toLocaleDateString(
                        "id-ID",
                      )}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadgeColor(
                      payment.status,
                    )}`}>
                    {payment.status}
                  </span>

                  {payment.status === "pending" && (
                    <div className='flex gap-2 shrink-0'>
                      <button
                        type='button'
                        onClick={() => handleVerify(payment.id, "approved")}
                        disabled={actingId === payment.id}
                        className='bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors'>
                        {actingId === payment.id ? "…" : "Approve"}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleVerify(payment.id, "rejected")}
                        disabled={actingId === payment.id}
                        className='border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors'>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal preview gambar full */}
      {previewUrl && (
        <div
          className='fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50'
          onClick={() => setPreviewUrl(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt='Bukti pembayaran'
            className='max-w-full max-h-full rounded-lg'
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
