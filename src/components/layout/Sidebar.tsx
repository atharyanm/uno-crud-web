'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MapPin,
  UserCheck,
  Gamepad2,
  LogOut,
  Menu,
  X,
  Target,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('loggedInUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, role: 'all' },
    { name: 'Players', href: '/player', icon: Users, role: 'admin' },
    { name: 'Places', href: '/place', icon: MapPin, role: 'admin' },
    { name: 'Games', href: '/game', icon: Gamepad2, role: 'admin' },
    { name: 'Users', href: '/user', icon: UserCheck, role: 'admin' },
  ];

  const visibleNav = navItems.filter(
    (item) => item.role === 'all' || user?.role === 'admin'
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-warm-card/90 backdrop-blur-md border-b border-warm-border z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-warm-text hover:bg-warm-border/50 rounded-lg transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2 text-warm-amber font-bold text-lg">
            <Target className="w-5 h-5" />
            <span>Sabung WR</span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-warm-text bg-warm-bg px-3 py-1 rounded-full border border-warm-border">
              {user.username}
            </span>
          </div>
        )}
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-warm-card/95 border-r border-warm-border backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header Branding */}
          <div className="h-16 px-6 border-b border-warm-border flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 text-warm-amber hover:text-warm-gold transition group"
            >
              <div className="p-2 rounded-xl bg-warm-amber/10 text-warm-amber group-hover:bg-warm-amber/20 transition">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-wide text-warm-text">
                  Sabung WR
                </h1>
                <span className="text-[10px] text-warm-subtle uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Sparkles size={10} className="text-warm-amber" /> Pro Calculator
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-warm-subtle hover:text-warm-text"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-warm-amber/20 to-warm-amber/5 text-warm-amber border border-warm-amber/30 shadow-md shadow-warm-amber/5'
                      : 'text-warm-muted hover:text-warm-text hover:bg-warm-bg/70'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-warm-amber' : 'text-warm-subtle'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User & Logout */}
        <div className="p-4 border-t border-warm-border bg-warm-bg/30">
          {user && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-warm-bg/60 border border-warm-border">
              <div className="flex flex-col overflow-hidden mr-2">
                <span className="text-sm font-semibold text-warm-text truncate">
                  {user.username}
                </span>
                <span className="text-[11px] text-warm-amber capitalize font-medium">
                  {user.role} Account
                </span>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 text-warm-subtle hover:text-warm-crimson hover:bg-warm-crimson/10 rounded-lg transition"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-warm w-full max-w-sm rounded-2xl p-6 border border-warm-border shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-warm-amber/10 flex items-center justify-center text-warm-amber">
              <LogOut size={24} />
            </div>
            <h3 className="text-lg font-bold text-warm-text">Confirm Logout</h3>
            <p className="text-sm text-warm-muted">
              Are you sure you want to sign out from Sabung Win Rate Calculator?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-warm-border text-warm-text hover:bg-warm-border/50 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-warm-amber hover:bg-warm-amberHover text-warm-bg font-semibold text-sm transition shadow-lg shadow-warm-amber/20"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
