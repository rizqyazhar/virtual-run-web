"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Event Management" },
  { href: "/admin/payments", label: "Payment Verification" },
  { href: "/admin/results", label: "Results Verification" },
  { href: "/admin/certificates", label: "Certificates" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  distance: "",
  price: "",
  start_date: "",
  end_date: "",
};

function toDateInputValue(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toISOString().slice(0, 10);
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Load events error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEditForm(event) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || "",
      distance: event.distance,
      price: event.price,
      start_date: toDateInputValue(event.start_date),
      end_date: toDateInputValue(event.end_date),
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const endpoint = editingId ? `/api/events/${editingId}` : "/api/events";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan event");
        setSubmitting(false);
        return;
      }

      setShowForm(false);
      await loadEvents();
    } catch (err) {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      await fetch(`/api/events/${id}`, { method: "DELETE" });
      setDeletingId(null);
      await loadEvents();
    } catch (err) {
      console.error("Delete event error:", err);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar links={NAV_LINKS} />

      <main className='max-w-7xl mx-auto px-6 pb-16'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl text-gray-900 font-bold'>
              Event Management
            </h1>
            <p className='text-sm text-gray-500'>
              Kelola semua event Virtual Run
            </p>
          </div>
          <button
            type='button'
            onClick={openCreateForm}
            className='flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors'>
            <Plus className='w-4 h-4' />
            Tambah Event
          </button>
        </div>

        <div className='bg-white rounded-2xl border border-gray-200 p-6'>
          {loading ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Memuat data…
            </p>
          ) : events.length === 0 ? (
            <p className='text-sm text-gray-400 py-8 text-center'>
              Belum ada event. Klik &quot;Tambah Event&quot; untuk membuat yang
              pertama.
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='bg-gray-50 text-left text-gray-500'>
                    <th className='py-2.5 px-3 font-medium rounded-l-lg'>
                      Event Name
                    </th>
                    <th className='py-2.5 px-3 font-medium'>Distance</th>
                    <th className='py-2.5 px-3 font-medium'>Price</th>
                    <th className='py-2.5 px-3 font-medium'>Start Date</th>
                    <th className='py-2.5 px-3 font-medium'>End Date</th>
                    <th className='py-2.5 px-3 font-medium rounded-r-lg text-right'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className='border-b border-gray-100 last:border-0'>
                      <td className='py-3 px-3 text-gray-500 font-medium'>
                        {event.title}
                      </td>
                      <td className='py-3 px-3 text-gray-500'>
                        {event.distance} km
                      </td>
                      <td className='py-3 px-3 text-gray-500'>
                        Rp {Number(event.price).toLocaleString("id-ID")}
                      </td>
                      <td className='py-3 px-3 text-gray-500'>
                        {new Date(event.start_date).toLocaleDateString("id-ID")}
                      </td>
                      <td className='py-3 px-3 text-gray-500'>
                        {new Date(event.end_date).toLocaleDateString("id-ID")}
                      </td>
                      <td className='py-3 px-3'>
                        <div className='flex items-center justify-end gap-2'>
                          <button
                            type='button'
                            onClick={() => openEditForm(event)}
                            className='p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors'
                            aria-label='Edit event'>
                            <Pencil className='w-4 h-4' />
                          </button>
                          <button
                            type='button'
                            onClick={() => setDeletingId(event.id)}
                            className='p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                            aria-label='Hapus event'>
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg text-gray-900 font-bold'>
                {editingId ? "Edit Event" : "Tambah Event Baru"}
              </h2>
              <button
                type='button'
                onClick={closeForm}
                className='p-1 text-gray-400 hover:text-black transition-colors'
                aria-label='Tutup'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm text-gray-900 font-medium mb-1.5'>
                  Nama Event
                </label>
                <input
                  type='text'
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className='w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
                  placeholder='Virtual Run 5K'
                />
              </div>

              <div>
                <label className='block text-sm text-gray-900 font-medium mb-1.5'>
                  Deskripsi
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className='w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm  text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition resize-none'
                  placeholder='Deskripsi singkat event'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm text-gray-900 font-medium mb-1.5'>
                    Jarak (km)
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    required
                    min='0'
                    value={form.distance}
                    onChange={(e) =>
                      setForm({ ...form, distance: e.target.value })
                    }
                    className='w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm  text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
                    placeholder='5'
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-900 font-medium mb-1.5'>
                    Harga (Rp)
                  </label>
                  <input
                    type='number'
                    min='0'
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className='w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm  text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
                    placeholder='50000'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm text-gray-900 font-medium mb-1.5'>
                    Tanggal Mulai
                  </label>
                  <input
                    type='date'
                    required
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                    className='w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-900 font-medium mb-1.5'>
                    Tanggal Selesai
                  </label>
                  <input
                    type='date'
                    required
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({ ...form, end_date: e.target.value })
                    }
                    className='w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
                  />
                </div>
              </div>

              {error && (
                <p className='text-sm text-red-600 font-medium' role='alert'>
                  {error}
                </p>
              )}

              <div className='flex gap-3 pt-2'>
                <button
                  type='button'
                  onClick={closeForm}
                  className='flex-1 border border-gray-200 hover:bg-gray-50 text-sm text-gray-500 font-medium py-2.5 rounded-lg transition-colors'>
                  Batal
                </button>
                <button
                  type='submit'
                  disabled={submitting}
                  className='flex-1 bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors'>
                  {submitting
                    ? "Menyimpan…"
                    : editingId
                      ? "Simpan Perubahan"
                      : "Buat Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-2xl w-full max-w-sm p-6'>
            <h2 className='text-lg text-gray-900 font-bold mb-2'>
              Hapus Event?
            </h2>
            <p className='text-sm text-gray-500 mb-6'>
              Semua data registrasi, pembayaran, dan hasil lari yang terkait
              event ini akan ikut terhapus permanen. Tindakan ini tidak bisa
              dibatalkan.
            </p>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setDeletingId(null)}
                className='flex-1 border border-gray-200 hover:bg-gray-50 text-sm text-gray-500 font-medium py-2.5 rounded-lg transition-colors'>
                Batal
              </button>
              <button
                type='button'
                onClick={() => handleDelete(deletingId)}
                disabled={deleteLoading}
                className='flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors'>
                {deleteLoading ? "Menghapus…" : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
