'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchData } from '@/lib/api';
import { Target, Lock, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

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
    <main className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-warm-card via-warm-bg to-warm-bg">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-warm-amber/10 border border-warm-amber/20 text-warm-amber mb-2 shadow-lg shadow-warm-amber/5">
            <Target className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-warm-text tracking-wide">
            Sabung Win Rate
          </h1>
          <p className="text-sm text-warm-muted flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-warm-amber" /> Sign in to your analytics dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-warm rounded-2xl p-6 sm:p-8 border border-warm-border shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-warm-crimson/10 border border-warm-crimson/30 text-warm-crimson text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
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
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-warm-bg/80 border border-warm-border text-warm-text placeholder:text-warm-subtle focus:outline-none focus:border-warm-amber focus:ring-1 focus:ring-warm-amber transition text-sm"
                />
              </div>
            </div>

            {/* Password Input */}
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
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-warm-bg/80 border border-warm-border text-warm-text placeholder:text-warm-subtle focus:outline-none focus:border-warm-amber focus:ring-1 focus:ring-warm-amber transition text-sm"
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
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-warm-amber to-warm-terracotta hover:from-warm-amberHover hover:to-warm-terracotta font-semibold text-warm-bg text-sm transition-all duration-200 shadow-lg shadow-warm-amber/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-warm-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-warm-subtle">
          Sabung Win Rate Calculator &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
