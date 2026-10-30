'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

interface Stats {
  reservations: number;
  revenue: number;
  pendingValidations: number;
  activeHotels: number;
  discountCount: number;
  totalDiscountTnd: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: 'Réservations totales', value: stats.reservations, icon: '📋', color: 'blue' },
        { label: 'Commissions encaissées', value: `${stats.revenue.toLocaleString()} TND`, icon: '💵', color: 'green' },
        { label: 'En attente validation', value: stats.pendingValidations, icon: '⏳', color: 'yellow' },
        { label: 'Hôtels actifs', value: stats.activeHotels, icon: '🏨', color: 'purple' },
        { label: 'Remises accordées', value: stats.discountCount, icon: '🏷️', color: 'orange' },
        { label: 'Total remises (impact)', value: `${stats.totalDiscountTnd?.toLocaleString()} TND`, icon: '⚠️', color: 'red' },
      ]
    : [];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-500 mt-1">Vue globale de la plateforme Tunisia Tonight</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`border rounded-xl p-6 flex items-center gap-4 ${colorMap[card.color]}`}
            >
              <span className="text-3xl">{card.icon}</span>
              <div>
                <p className="text-sm font-medium opacity-75">{card.label}</p>
                <p className="text-2xl font-bold mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
