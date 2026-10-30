'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

interface Reservation {
  id: string;
  reference: string;
  status: string;
  checkin: string;
  checkout: string;
  nights: number;
  contractPriceTnd: number;
  commissionTnd: number;
  totalTnd: number;
  hotel: { name: string; city: string };
  client: { firstName: string; lastName: string; email: string };
  discount: { discountTnd: number; discountPct: number | null } | null;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PAID: 'bg-blue-100 text-blue-700',
  VALIDATED: 'bg-green-100 text-green-700',
  REFUSED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    adminApi.getReservations().then(setReservations).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Réservations</h2>
        <p className="text-gray-500 mt-1">{reservations.length} dossier(s) au total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'PENDING', 'PAID', 'VALIDATED', 'REFUSED', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === s ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? `Tous (${reservations.length})` : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Référence</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Hôtel</th>
                <th className="px-4 py-3 text-left">Séjour</th>
                <th className="px-4 py-3 text-right">Prix contrat</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-center">Remise</th>
                <th className="px-4 py-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-navy-700">{r.reference}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.client.firstName} {r.client.lastName}</p>
                    <p className="text-gray-400 text-xs">{r.client.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.hotel.name}</p>
                    <p className="text-gray-400 text-xs">{r.hotel.city}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(r.checkin).toLocaleDateString('fr-TN')} → {new Date(r.checkout).toLocaleDateString('fr-TN')}
                    <span className="ml-1 text-gray-400">({r.nights}n)</span>
                  </td>
                  <td className="px-4 py-3 text-right">{r.contractPriceTnd} TND</td>
                  <td className="px-4 py-3 text-right text-brand-600 font-semibold">{r.commissionTnd} TND</td>
                  <td className="px-4 py-3 text-center">
                    {r.discount ? (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        -{r.discount.discountTnd} TND
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Aucune réservation
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
