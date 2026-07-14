"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Trophy, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal masuk");
        setLoading(false);
        return;
      }

      await refreshUser();
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Tidak bisa terhubung ke server");
      setLoading(false);
    }
  }

  function fillDemo(role) {
    setForm(
      role === "admin"
        ? { email: "admin@virtualrun.com", password: "admin123" }
        : { email: "budi@test.com", password: "budi123" },
    );
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gray-50'>
      {/* Logo & nama produk */}
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

      {/* Card form */}
      <div className='w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8'>
        <h1 className='text-2xl text-gray-900 font-bold text-center'>
          Welcome Back
        </h1>
        <p className='text-sm text-gray-500 text-center mt-1 mb-8'>
          Sign in to your Virtual Run Event account
        </p>

        <form onSubmit={handleSubmit} className='space-y-4'>
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
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder='••••••••••'
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
            {loading ? "Memproses…" : "Sign In"}
          </button>
        </form>

        <p className='text-sm text-gray-500 text-center mt-5'>
          Belum punya akun?{" "}
          <Link
            href='/register'
            className='text-black font-semibold hover:underline'>
            Daftar sekarang
          </Link>
        </p>

        <hr className='my-6 border-gray-200' />

        {/* Demo credentials */}
        <div>
          <p className='text-xs text-gray-400 mb-2'>Demo Credentials:</p>
          <div className='grid grid-cols-2 gap-3 text-xs text-gray-400'>
            <button
              type='button'
              onClick={() => fillDemo("admin")}
              className='text-left hover:text-gray-600 transition-colors'>
              <span className='font-medium text-gray-500'>Admin:</span>
              <br />
              Email: admin@virtualrun.com
              <br />
              Password: admin123
            </button>
            <button
              type='button'
              onClick={() => fillDemo("participant")}
              className='text-left hover:text-gray-600 transition-colors'>
              <span className='font-medium text-gray-500'>Participant:</span>
              <br />
              Email: budi@test.com
              <br />
              Password: budi123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
