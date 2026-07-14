"use client";

import { useEffect, useState, useCallback } from "react";
import { Medal } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatInterval } from "@/lib/format";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Browse Events" },
  { href: "/dashboard/registrations", label: "My Registrations" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/certificates", label: "Certificates" },
];

const RANK_COLORS = {
  1: "bg-yellow-100 text-yellow-700",
  2: "bg-gray-200 text-gray-700",
  3: "bg-orange-100 text-orange-700",
};

export default function LeaderboardPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    }
    loadEvents();
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const query = selectedEventId ? `?event_id=${selectedEventId}` : "";
      const res = await fetch(`/api/leaderboard${query}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error("Load leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-4xl mx-auto px-6 pb-16'>
        <div className='mb-6'>
          <h1 className='text-2xl text-gray-900 font-bold'>Leaderboard</h1>
          <p className='text-sm text-gray-500'>
            Peringkat peserta berdasarkan hasil lari terverifikasi
          </p>
        </div>

        <div className='mb-6'>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className='px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition bg-white'>
            <option value=''>Semua Event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div className='bg-white rounded-2xl border border-gray-200 p-6'>
          {loading ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Memuat data…
            </p>
          ) : leaderboard.length === 0 ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Belum ada hasil lari yang terverifikasi untuk ditampilkan.
            </p>
          ) : (
            <div className='space-y-2'>
              {leaderboard.map((entry, idx) => (
                <div
                  key={`${entry.event_id}-${entry.user_id}`}
                  className='flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                        RANK_COLORS[entry.rank] || "bg-gray-100 text-gray-600"
                      }`}>
                      {entry.rank <= 3 ? (
                        <Medal className='w-4 h-4' />
                      ) : (
                        entry.rank
                      )}
                    </span>
                    <div>
                      <p className='text-sm text-gray-700 font-medium'>
                        {entry.user_name}
                      </p>
                      {!selectedEventId && (
                        <p className='text-xs text-gray-500'>
                          {entry.event_title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-mono font-semibold text-gray-800'>
                      {formatInterval(entry.finish_time)}
                    </p>
                    <p className='text-xs text-gray-400'>{entry.distance} km</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
