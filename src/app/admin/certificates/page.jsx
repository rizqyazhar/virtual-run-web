"use client";

import { useEffect, useState } from "react";
import { Award, Download } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatInterval } from "@/lib/format";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Event Management" },
  { href: "/admin/payments", label: "Payment Verification" },
  { href: "/admin/results", label: "Results Verification" },
  { href: "/admin/certificates", label: "Certificates" },
];

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCertificates() {
      try {
        const res = await fetch("/api/certificates");
        const data = await res.json();
        setCertificates(data.certificates || []);
      } catch (err) {
        console.error("Load certificates error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCertificates();
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-7xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>Certificates</h1>
          <p className='text-sm text-gray-500'>
            Semua sertifikat digital yang sudah diaktifkan
          </p>
        </div>

        <div className='bg-white rounded-2xl border border-gray-200 p-6'>
          {loading ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Memuat data…
            </p>
          ) : certificates.length === 0 ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Belum ada sertifikat yang diaktifkan. Aktifkan lewat halaman
              Results Verification.
            </p>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {certificates.map((cert) => (
                <div
                  key={cert.running_result_id}
                  className='border border-gray-100 rounded-xl p-4'>
                  <div className='w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3'>
                    <Award className='w-5 h-5' strokeWidth={1.75} />
                  </div>
                  <p className='font-medium text-sm text-gray-700 truncate'>
                    {cert.participant_name}
                  </p>
                  <p className='text-xs text-gray-500 truncate'>
                    {cert.event_title}
                  </p>
                  <p className='text-xs text-gray-500 font-mono mt-2'>
                    {cert.distance} km · {formatInterval(cert.finish_time)}
                  </p>
                  <a
                    href={`/api/files/${cert.certificate_url}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-700 font-medium border border-gray-200 hover:bg-gray-50 py-2 rounded-lg transition-colors'>
                    <Download className='w-3.5 h-3.5' />
                    Lihat PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
