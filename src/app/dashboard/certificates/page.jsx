"use client";

import { useEffect, useState } from "react";
import { Award, Download } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatInterval } from "@/lib/format";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Browse Events" },
  { href: "/dashboard/registrations", label: "My Registrations" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/certificates", label: "Certificates" },
];

export default function MyCertificatesPage() {
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

      <main className='max-w-5xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>My Certificates</h1>
          <p className='text-sm text-gray-500'>
            Sertifikat digital aktif setelah hasil lari Anda diverifikasi &
            diaktifkan admin
          </p>
        </div>

        {loading ? (
          <p className='text-sm text-gray-400 py-8 text-center'>Memuat data…</p>
        ) : certificates.length === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
            <Award
              className='w-10 h-10 text-gray-300 mx-auto mb-3'
              strokeWidth={1.5}
            />
            <p className='text-sm text-gray-400'>
              Belum ada sertifikat aktif. Selesaikan event, upload hasil lari,
              dan tunggu admin memverifikasi & mengaktifkan sertifikat Anda.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {certificates.map((cert) => (
              <div
                key={cert.running_result_id}
                className='bg-white rounded-2xl border border-gray-200 p-6'>
                <div className='w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4'>
                  <Award className='w-5 h-5' strokeWidth={1.75} />
                </div>
                <p className='text-gray-700 font-bold'>{cert.event_title}</p>
                <p className='text-sm text-gray-500 font-mono mt-1'>
                  {cert.distance} km · {formatInterval(cert.finish_time)}
                </p>

                <a
                  href={`/api/files/${cert.certificate_url}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-5 flex items-center justify-center gap-1.5 text-sm font-medium bg-black hover:bg-gray-800 text-white py-2.5 rounded-lg transition-colors'>
                  <Download className='w-4 h-4' />
                  Download Sertifikat
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
