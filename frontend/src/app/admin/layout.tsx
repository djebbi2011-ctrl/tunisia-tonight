'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

const NAV = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/hotels', label: '🏨 Hôtels' },
  { href: '/admin/contracts', label: '📄 Contrats' },
  { href: '/admin/discounts', label: '💰 Journal Remises' },
  { href: '/admin/reservations', label: '📋 Réservations' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || !['ADMIN', 'SUPER_ADMIN'].includes(user?.role ?? '')) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-navy-700">
          <h1 className="text-xl font-bold text-brand-400">Tunisia Tonight</h1>
          <p className="text-xs text-gray-400 mt-1">Back-office Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-navy-700 text-xs text-gray-500">
          {user?.email}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
