"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Trophy, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mendaftar");
        setLoading(false);
        return;
      }

      await refreshUser();
      router.push("/dashboard");
    } catch {
      setError("Tidak bisa terhubung ke server");
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gray-50'>
      <div className='flex items-center gap-3 mb-8'>
        <div className='w-12 h-12 rounded-xl bg-black flex items-center justify-center'>
          <Trophy className='w-6 h-6 text-white' strokeWidth={1.75} />
        </div>
        <div>
          <p className='text-xl text-gray-900 font-bold leading-tight'>
            Virtual Run
          </p>
          <p className='text-sm text-gray-500 leading-tight'>
            Event Management
          </p>
        </div>
      </div>

      <div className='w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8'>
        <h1 className='text-2xl text-gray-900 font-bold text-center'>
          Create Account
        </h1>
        <p className='text-sm text-gray-500 text-center mt-1 mb-8'>
          Daftar untuk mulai mengikuti event Virtual Run
        </p>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm text-gray-900 font-medium mb-1.5'>
              Full Name
            </label>
            <div className='relative'>
              <User className='w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
              <input
                type='text'
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder='Nama lengkap Anda'
                className='w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm text-gray-900 font-medium mb-1.5'>
              Email Address
            </label>
            <div className='relative'>
              <Mail className='w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
              <input
                type='email'
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder='you@example.com'
                className='w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm text-gray-900 font-medium mb-1.5'>
              Password
            </label>
            <div className='relative'>
              <Lock className='w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder='Minimal 6 karakter'
                className='w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition'
              />
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                className='absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                tabIndex={-1}>
                {showPassword ? (
                  <EyeOff className='w-4 h-4' />
                ) : (
                  <Eye className='w-4 h-4' />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className='text-sm text-red-600 font-medium' role='alert'>
              {error}
            </p>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors'>
            {loading ? "Memproses…" : "Create Account"}
          </button>
        </form>

        <p className='text-sm text-gray-500 text-center mt-5'>
          Sudah punya akun?{" "}
          <Link
            href='/login'
            className='text-black font-semibold hover:underline'>
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
