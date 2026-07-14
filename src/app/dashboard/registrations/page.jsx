"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Upload } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatInterval } from "@/lib/format";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Browse Events" },
  { href: "/dashboard/registrations", label: "My Registrations" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/certificates", label: "Certificates" },
];

function statusBadgeColor(label) {
  if (label === "Completed") return "bg-green-100 text-green-700";
  if (label.includes("Ditolak")) return "bg-red-100 text-red-700";
  if (label.includes("Verifikasi")) return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
}

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentModalReg, setPaymentModalReg] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [resultModalReg, setResultModalReg] = useState(null);
  const [resultForm, setResultForm] = useState({
    distance: "",
    finish_time: "",
    file: null,
  });
  const [resultSubmitting, setResultSubmitting] = useState(false);
  const [resultError, setResultError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, resultRes] = await Promise.all([
        fetch("/api/registrations"),
        fetch("/api/running-results"),
      ]);
      setRegistrations((await regRes.json()).registrations || []);
      setResults((await resultRes.json()).results || []);
    } catch (err) {
      console.error("Load registrations error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resultByRegistrationId = new Map(
    results.map((r) => [r.registration_id, r]),
  );

  function getStatusLabel(reg) {
    if (!reg.payment_status) return "Menunggu Pembayaran";
    if (reg.payment_status === "pending") return "Verifikasi Pembayaran";
    if (reg.payment_status === "rejected") return "Pembayaran Ditolak";
    if (!reg.result_status) return "Belum Upload Hasil";
    if (reg.result_status === "pending") return "Verifikasi Hasil";
    if (reg.result_status === "rejected") return "Hasil Ditolak";
    return "Completed";
  }

  async function submitPayment(e) {
    e.preventDefault();
    if (!paymentFile) {
      setPaymentError("Pilih file bukti pembayaran");
      return;
    }
    setPaymentSubmitting(true);
    setPaymentError("");

    try {
      const formData = new FormData();
      formData.append("registration_id", paymentModalReg.id);
      formData.append("file", paymentFile);

      const res = await fetch("/api/payments", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.error || "Gagal upload bukti pembayaran");
        setPaymentSubmitting(false);
        return;
      }

      setPaymentModalReg(null);
      setPaymentFile(null);
      await loadData();
    } catch (err) {
      setPaymentError("Tidak bisa terhubung ke server");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function submitResult(e) {
    e.preventDefault();
    if (!resultForm.file || !resultForm.distance || !resultForm.finish_time) {
      setResultError("Semua field wajib diisi");
      return;
    }
    setResultSubmitting(true);
    setResultError("");

    try {
      const formData = new FormData();
      formData.append("registration_id", resultModalReg.id);
      formData.append("distance", resultForm.distance);
      formData.append("finish_time", resultForm.finish_time);
      formData.append("file", resultForm.file);

      const res = await fetch("/api/running-results", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setResultError(data.error || "Gagal upload hasil lari");
        setResultSubmitting(false);
        return;
      }

      setResultModalReg(null);
      setResultForm({ distance: "", finish_time: "", file: null });
      await loadData();
    } catch (err) {
      setResultError("Tidak bisa terhubung ke server");
    } finally {
      setResultSubmitting(false);
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-7xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>My Registrations</h1>
          <p className='text-sm text-gray-500'>
            Kelola pembayaran dan hasil lari Anda di sini
          </p>
        </div>

        <div className='bg-white rounded-2xl border border-gray-200 p-6'>
          {loading ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Memuat data…
            </p>
          ) : registrations.length === 0 ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Belum ada registrasi. Yuk daftar event di halaman Browse Events.
            </p>
          ) : (
            <div className='space-y-3'>
              {registrations.map((reg) => {
                const result = resultByRegistrationId.get(reg.id);
                const label = getStatusLabel(reg);
                const canUploadPayment =
                  !reg.payment_status || reg.payment_status === "rejected";
                const canUploadResult =
                  reg.payment_status === "approved" &&
                  (!reg.result_status || reg.result_status === "rejected");

                return (
                  <div
                    key={reg.id}
                    className='border border-gray-100 rounded-xl p-4'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <div>
                        <p className='font-medium text-sm text-gray-700'>
                          {reg.event_title}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Terdaftar:{" "}
                          {new Date(reg.registration_date).toLocaleDateString(
                            "id-ID",
                          )}
                          {result && (
                            <>
                              {" "}
                              · {result.distance} km ·{" "}
                              {formatInterval(result.finish_time)}
                            </>
                          )}
                        </p>
                      </div>

                      <div className='flex items-center gap-2'>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeColor(label)}`}>
                          {label}
                        </span>

                        {canUploadPayment && (
                          <button
                            type='button'
                            onClick={() => {
                              setPaymentModalReg(reg);
                              setPaymentError("");
                            }}
                            className='flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors'>
                            <Upload className='w-3.5 h-3.5' />
                            {reg.payment_status === "rejected"
                              ? "Upload Ulang"
                              : "Upload Bukti Bayar"}
                          </button>
                        )}

                        {canUploadResult && (
                          <button
                            type='button'
                            onClick={() => {
                              setResultModalReg(reg);
                              setResultError("");
                            }}
                            className='flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors'>
                            <Upload className='w-3.5 h-3.5' />
                            {reg.result_status === "rejected"
                              ? "Upload Ulang"
                              : "Upload Hasil Lari"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {paymentModalReg && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-2xl w-full max-w-sm p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg text-gray-900 font-bold'>
                Upload Bukti Pembayaran
              </h2>
              <button
                type='button'
                onClick={() => setPaymentModalReg(null)}
                className='text-gray-400 hover:text-black'>
                <X className='w-5 h-5' />
              </button>
            </div>
            <p className='text-sm text-gray-500 mb-4'>
              {paymentModalReg.event_title}
            </p>

            <form onSubmit={submitPayment} className='space-y-4'>
              <div>
                <label className='block text-sm text-gray-500 font-medium mb-1.5'>
                  Bukti Transfer (JPG/PNG, maks 4MB)
                </label>
                <input
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  required
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className='w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-sm file:font-medium hover:file:bg-gray-200'
                />
              </div>

              {paymentError && (
                <p className='text-sm text-red-600 font-medium'>
                  {paymentError}
                </p>
              )}

              <button
                type='submit'
                disabled={paymentSubmitting}
                className='w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors'>
                {paymentSubmitting ? "Mengunggah…" : "Kirim Bukti Pembayaran"}
              </button>
            </form>
          </div>
        </div>
      )}

      {resultModalReg && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-2xl w-full max-w-sm p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg text-gray-900 font-bold'>
                Upload Hasil Lari
              </h2>
              <button
                type='button'
                onClick={() => setResultModalReg(null)}
                className='text-gray-400 hover:text-black'>
                <X className='w-5 h-5' />
              </button>
            </div>
            <p className='text-sm text-gray-500 mb-4'>
              {resultModalReg.event_title}
            </p>

            <form onSubmit={submitResult} className='space-y-4'>
              <div>
                <label className='block text-sm text-gray-500 font-medium mb-1.5'>
                  Jarak Tempuh (km)
                </label>
                <input
                  type='number'
                  step='0.01'
                  required
                  value={resultForm.distance}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, distance: e.target.value })
                  }
                  className='w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
                  placeholder='5.2'
                />
              </div>

              <div>
                <label className='block text-sm text-gray-500 font-medium mb-1.5'>
                  Waktu Tempuh (HH:MM:SS)
                </label>
                <input
                  type='text'
                  required
                  pattern='^\d{2}:\d{2}:\d{2}$'
                  value={resultForm.finish_time}
                  onChange={(e) =>
                    setResultForm({
                      ...resultForm,
                      finish_time: e.target.value,
                    })
                  }
                  className='w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
                  placeholder='00:35:20'
                />
              </div>

              <div>
                <label className='block text-sm text-gray-500 font-medium mb-1.5'>
                  Screenshot Hasil (JPG/PNG, maks 4MB)
                </label>
                <input
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  required
                  onChange={(e) =>
                    setResultForm({
                      ...resultForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className='w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-sm file:font-medium hover:file:bg-gray-200'
                />
              </div>

              {resultError && (
                <p className='text-sm text-red-600 font-medium'>
                  {resultError}
                </p>
              )}

              <button
                type='submit'
                disabled={resultSubmitting}
                className='w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors'>
                {resultSubmitting ? "Mengunggah…" : "Kirim Hasil Lari"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
