'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

interface Hotel {
  id: string;
  name: string;
  city: string;
  stars: number;
  hotelier: { firstName: string; lastName: string; email: string } | null;
  _count: { reservations: number };
}

const STARS = [1, 2, 3, 4, 5];

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getHotels().then(setHotels).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Hôtels partenaires</h2>
        <p className="text-gray-500 mt-1">{hotels.length} établissement(s) référencé(s)</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Hôtel</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Hôtelier référent</th>
                <th className="px-4 py-3 text-right">Réservations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hotels.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold">{h.name}</td>
                  <td className="px-4 py-3 text-gray-600">{h.city}</td>
                  <td className="px-4 py-3">
                    {STARS.map((s) => (
                      <span key={s} className={s <= h.stars ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {h.hotelier
                      ? `${h.hotelier.firstName} ${h.hotelier.lastName} (${h.hotelier.email})`
                      : <span className="text-gray-400 italic">Non assigné</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{h._count?.reservations ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
