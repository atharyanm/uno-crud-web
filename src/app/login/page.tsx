'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchData } from '@/lib/api';
import { Target, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, Flame, Users, Trophy } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const users = await fetchData('User');
      const foundUser = users.find(
        (u) => u.username === username && u.password === password
      );

      if (foundUser) {
        localStorage.getItem('loggedInUser');
        localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
        router.push('/dashboard');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-warm-card via-warm-bg to-warm-bg">
      <div className="w-full max-w-4xl glass-warm rounded-3xl border border-warm-border shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* Tongkrongan Hero Banner Side */}
        <div className="relative min-h-[260px] md:min-h-[500px] flex flex-col justify-between p-6 sm:p-8 bg-cover bg-center overflow-hidden"
             style={{ backgroundImage: `url('/images/tongkrongan.png')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-warm-bg via-warm-bg/70 to-warm-bg/40" />

          {/* Top Badge */}
          <div className="relative z-10 flex items-center gap-2 text-warm-amber font-bold text-sm tracking-wider uppercase bg-warm-bg/80 backdrop-blur-md px-3.5 py-1.5 rounded-full w-fit border border-warm-amber/30">
            <Flame className="w-4 h-4 fill-warm-amber text-warm-amber" />
            <span>Web Tongkrongan Official</span>
          </div>

          {/* Bottom Hero Description */}
          <div className="relative z-10 space-y-3 pt-12 md:pt-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-warm-amber/20 text-warm-amber border border-warm-amber/40">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-text tracking-tight">
                Sabung Win Rate
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-warm-muted leading-relaxed">
              Platform resmi statistik game & win rate tongkrongan. Pantau peringkat, kekalahan terlelap, dan sertifikat performa tongkrongan secara live!
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-warm-subtle">
              <span className="flex items-center gap-1">
                <Users size={14} className="text-warm-amber" /> Real-time Stats
              </span>
              <span className="flex items-center gap-1">
                <Trophy size={14} className="text-warm-gold" /> Leaderboard
              </span>
            </div>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="p-6 sm:p-8 flex flex-col justify-center space-y-6 bg-warm-card/60 backdrop-blur-md">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-warm-text">Sign In Account</h3>
            <p className="text-xs text-warm-muted">
              Masukkan akun tongkrongan kamu untuk akses dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-warm-crimson/10 border border-warm-crimson/30 text-warm-crimson text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-muted">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-warm-subtle">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username tongkrongan"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-warm-bg/80 border border-warm-border text-warm-text placeholder:text-warm-subtle focus:outline-none focus:border-warm-amber text-xs transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-muted">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-warm-subtle">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password akun"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-warm-bg/80 border border-warm-border text-warm-text placeholder:text-warm-subtle focus:outline-none focus:border-warm-amber text-xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-warm-subtle hover:text-warm-text transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-warm-amber to-warm-terracotta hover:from-warm-amberHover hover:to-warm-terracotta font-semibold text-warm-bg text-xs transition-all duration-200 shadow-lg shadow-warm-amber/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-warm-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Tongkrongan</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-warm-subtle pt-2">
            Sabung Win Rate Tongkrongan &copy; {new Date().getFullYear()}
          </p>
        </div>

      </div>
    </main>
  );
}
