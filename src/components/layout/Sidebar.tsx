'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MapPin,
  UserCheck,
  Gamepad2,
  Trophy,
  LogOut,
  Menu,
  X,
  Target,
  Sparkles,
  ChevronDown,
  User,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, role: 'all' },
    { name: 'Match Management', href: '/match', icon: Trophy, role: 'admin' },
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
      {/* Top Navbar Header (Visible on Desktop & Mobile) */}
      <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-warm-card/90 backdrop-blur-md border-b border-warm-border z-40 px-4 sm:px-6 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & Brand logo for mobile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-warm-text hover:bg-warm-border/50 rounded-lg transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="lg:hidden flex items-center gap-2 text-warm-amber font-bold text-lg">
            <Target className="w-5 h-5" />
            <span>Sabung WR</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-warm-muted font-medium">
            <Sparkles size={14} className="text-warm-amber" />
            <span>Web Tongkrongan Official Winrate Calculator</span>
          </div>
        </div>

        {/* Right Side: Interactive Profile Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-warm-bg/80 hover:bg-warm-border/50 border border-warm-border transition group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-warm-amber to-amber-600 flex items-center justify-center text-warm-bg font-black text-xs shadow-md shadow-warm-amber/20">
                {user.username.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-warm-text group-hover:text-warm-amber transition line-clamp-1">
                  {user.username}
                </span>
                <span className="text-[10px] text-warm-subtle capitalize font-semibold">
                  {user.role}
                </span>
              </div>

              <ChevronDown
                size={14}
                className={`text-warm-subtle transition-transform duration-200 ${
                  profileDropdownOpen ? 'rotate-180 text-warm-amber' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-warm border border-warm-border shadow-2xl overflow-hidden z-50 animate-fadeIn space-y-1 p-2">
                {/* User Info Header */}
                <div className="p-3 rounded-xl bg-warm-bg/80 border border-warm-border/60 mb-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-warm-amber" />
                    <span className="text-xs font-bold text-warm-text truncate">{user.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-warm-amber capitalize font-semibold pl-5">
                    <ShieldCheck size={12} />
                    <span>{user.role} Privileges</span>
                  </div>
                </div>

                {/* Logout Dropdown Item */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-warm-crimson hover:bg-warm-crimson/15 font-semibold text-xs transition"
                >
                  <LogOut size={16} />
                  <span>Log Out Account</span>
                </button>
              </div>
            )}
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

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-warm-border bg-warm-bg/30 text-center">
          <p className="text-[11px] text-warm-subtle">
            Sabung WR &bull; Web Tongkrongan
          </p>
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
              Apakah kamu yakin ingin keluar (*log out*) dari akun <span className="text-warm-amber font-semibold">{user?.username}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-warm-border text-warm-text hover:bg-warm-border/50 text-sm font-medium transition"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-warm-crimson hover:bg-red-600 text-white font-semibold text-sm transition shadow-lg shadow-warm-crimson/20"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
