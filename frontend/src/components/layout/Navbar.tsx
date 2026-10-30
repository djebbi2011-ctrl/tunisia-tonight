'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-navy-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-brand-400">🌙</span>
          <span className="hidden sm:block">Tunisia Tonight</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/hotels?type=nuit" className="text-gray-300 hover:text-white transition">🌙 Nuits</Link>
          <Link href="/hotels?type=daypass" className="text-gray-300 hover:text-white transition">☀️ Day Pass</Link>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
              >
                <span className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {user?.firstName?.[0]?.toUpperCase()}
                </span>
                <span className="hidden sm:block">{user?.firstName}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 w-44 overflow-hidden z-50">
                  {user?.role === 'CLIENT' && (
                    <Link href="/account" className="block px-4 py-2.5 hover:bg-gray-50 text-sm" onClick={() => setMenuOpen(false)}>
                      Mes réservations
                    </Link>
                  )}
                  {user?.role === 'HOTELIER' && (
                    <Link href="/extranet" className="block px-4 py-2.5 hover:bg-gray-50 text-sm" onClick={() => setMenuOpen(false)}>
                      Extranet hôtelier
                    </Link>
                  )}
                  {['ADMIN', 'SUPER_ADMIN'].includes(user?.role ?? '') && (
                    <Link href="/admin" className="block px-4 py-2.5 hover:bg-gray-50 text-sm" onClick={() => setMenuOpen(false)}>
                      Back-office
                    </Link>
                  )}
                  <hr className="border-gray-100" />
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm font-medium transition"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
