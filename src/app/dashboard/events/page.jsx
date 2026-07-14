"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Browse Events" },
  { href: "/dashboard/registrations", label: "My Registrations" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/certificates", label: "Certificates" },
];

export default function BrowseEventsPage() {
  const [events, setEvents] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [eventsRes, regRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/registrations"),
      ]);
      const eventsData = await eventsRes.json();
      const regData = await regRes.json();

      setEvents(eventsData.events || []);
      setRegisteredEventIds(
        new Set((regData.registrations || []).map((r) => r.event_id)),
      );
    } catch (err) {
      console.error("Load events error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRegister(eventId) {
    setRegisteringId(eventId);
    setMessage("");
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Gagal mendaftar");
        setRegisteringId(null);
        return;
      }

      setMessage(
        'Berhasil mendaftar! Silakan lanjut upload bukti pembayaran di "My Registrations".',
      );
      await loadData();
    } catch (err) {
      setMessage("Tidak bisa terhubung ke server");
    } finally {
      setRegisteringId(null);
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-7xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>Browse Events</h1>
          <p className='text-sm text-gray-500'>
            Pilih event Virtual Run yang ingin Anda ikuti
          </p>
        </div>

        {message && (
          <div className='mb-4 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium'>
            {message}
          </div>
        )}

        {loading ? (
          <p className='text-sm text-gray-400 py-8 text-center'>Memuat data…</p>
        ) : events.length === 0 ? (
          <p className='text-sm text-gray-400 py-8 text-center'>
            Belum ada event yang tersedia.
          </p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {events.map((event) => {
              const isRegistered = registeredEventIds.has(event.id);
              return (
                <div
                  key={event.id}
                  className='bg-white rounded-2xl border border-gray-200 p-6 flex flex-col'>
                  <h3 className='font-bold text-lg mb-1'>{event.title}</h3>
                  {event.description && (
                    <p className='text-sm text-gray-500 mb-4 line-clamp-2'>
                      {event.description}
                    </p>
                  )}

                  <div className='space-y-2 text-sm text-gray-600 mb-6'>
                    <div className='flex items-center gap-2'>
                      <MapPin className='w-4 h-4 text-gray-400' />
                      {event.distance} km
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      {new Date(event.start_date).toLocaleDateString(
                        "id-ID",
                      )} —{" "}
                      {new Date(event.end_date).toLocaleDateString("id-ID")}
                    </div>
                    <div className='flex items-center gap-2'>
                      <DollarSign className='w-4 h-4 text-gray-400' />
                      Rp {Number(event.price).toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className='mt-auto'>
                    {isRegistered ? (
                      <div className='flex items-center justify-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 py-2.5 rounded-lg'>
                        <CheckCircle2 className='w-4 h-4' />
                        Sudah Terdaftar
                      </div>
                    ) : (
                      <button
                        type='button'
                        onClick={() => handleRegister(event.id)}
                        disabled={registeringId === event.id}
                        className='w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors'>
                        {registeringId === event.id
                          ? "Mendaftar…"
                          : "Daftar Event"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
