'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

interface DiscountEntry {
  id: string;
  createdAt: string;
  discountPct: number | null;
  discountTnd: number;
  netPriceTnd: number;
  commissionImpact: number;
  notes: string | null;
  reservation: {
    reference: string;
    contractPriceTnd: number;
    commissionTnd: number;
    checkin: string;
    checkout: string;
    hotel: { name: string; city: string };
    client: { firstName: string; lastName: string; email: string };
  };
  hotelier: { firstName: string; lastName: string; email: string };
}

export default function DiscountsLogPage() {
  const [discounts, setDiscounts] = useState<DiscountEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.getDiscountsLog().then(setDiscounts).finally(() => setLoading(false));
  }, []);

  const filtered = discounts.filter(
    (d) =>
      d.reservation.reference.toLowerCase().includes(search.toLowerCase()) ||
      d.reservation.hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      d.hotelier.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalImpact = filtered.reduce((s, d) => s + d.commissionImpact, 0);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Journal des Remises Hôtelières</h2>
        <p className="text-gray-500 mt-1">
          Toutes les baisses de tarif appliquées par les hôteliers — impact sur nos commissions
        </p>
      </div>

      {/* Alert banner */}
      {!loading && discounts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-orange-800">
              Impact total des remises : {Math.abs(discounts.reduce((s, d) => s + d.commissionImpact, 0)).toLocaleString()} TND
            </p>
            <p className="text-sm text-orange-600">
              {discounts.length} remise(s) accordée(s) — Impact calculé sur la commission Tunisia Tonight
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par référence, hôtel, hôtelier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Hôtel</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Hôtelier</th>
                <th className="px-4 py-3">Séjour</th>
                <th className="px-4 py-3 text-right">Prix contrat</th>
                <th className="px-4 py-3 text-right">Remise</th>
                <th className="px-4 py-3 text-right">Prix net</th>
                <th className="px-4 py-3 text-right text-red-600">Impact comm.</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded">
                      {d.reservation.reference}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{d.reservation.hotel.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.reservation.client.firstName} {d.reservation.client.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.hotelier.email}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(d.reservation.checkin).toLocaleDateString('fr-TN')} →{' '}
                    {new Date(d.reservation.checkout).toLocaleDateString('fr-TN')}
                  </td>
                  <td className="px-4 py-3 text-right">{d.reservation.contractPriceTnd} TND</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-brand-600 font-semibold">
                      -{d.discountTnd} TND
                      {d.discountPct && <span className="text-xs text-gray-400 ml-1">({d.discountPct}%)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{d.netPriceTnd} TND</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-red-600 font-bold">
                      {d.commissionImpact < 0 ? '-' : ''}{Math.abs(d.commissionImpact)} TND
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(d.createdAt).toLocaleDateString('fr-TN')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    Aucune remise enregistrée
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold">
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-right text-gray-700">Impact total filtré :</td>
                  <td className="px-4 py-3 text-right text-red-600">{Math.abs(totalImpact).toLocaleString()} TND</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
