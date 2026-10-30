'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { reservationsApi } from '@/lib/api';
import { Reservation, RESERVATION_STATUS_LABELS, MEAL_PLAN_LABELS } from '@/types';
import { Calendar, MapPin, Loader2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  PAID:            'bg-blue-100 text-blue-700',
  VALIDATED:       'bg-green-100 text-green-700',
  REFUSED:         'bg-red-100 text-red-700',
  CANCELLED:       'bg-gray-100 text-gray-600',
  COMPLETED:       'bg-purple-100 text-purple-700',
};

export default function AccountPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reservationsApi.myReservations()
      .then(({ data }) => setReservations(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-navy-500 mb-6">Mes réservations</h1>

        {loading && (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-600 animate-spin" /></div>
        )}

        {!loading && reservations.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🏨</div>
            <h3 className="font-bold text-navy-500 mb-2">Aucune réservation</h3>
            <p className="text-gray-500 text-sm mb-4">Votre prochaine escapade tunisienne commence ici.</p>
            <a href="/" className="btn-primary inline-block">Rechercher un hôtel</a>
          </div>
        )}

        <div className="space-y-4">
          {reservations.map((r) => (
            <div key={r.id} className="card p-5 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-xs text-gray-400">#{r.reference}</span>
                    <h3 className="font-bold text-navy-500">{r.hotel?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />{r.hotel?.city}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${STATUS_COLORS[r.status]}`}>
                    {RESERVATION_STATUS_LABELS[r.status]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                    {new Date(r.checkin).toLocaleDateString('fr-FR')} → {new Date(r.checkout).toLocaleDateString('fr-FR')}
                  </span>
                  <span>🛏️ {r.roomType?.name}</span>
                  <span>☕ {MEAL_PLAN_LABELS[r.mealPlan]}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-black text-brand-600">{r.commissionTnd} TND</div>
                <div className="text-xs text-gray-400">commission payée</div>
                <div className="text-sm font-semibold text-gray-600 mt-1">
                  {(r.discount ? r.discount.netPriceTnd - r.commissionTnd : r.totalTnd - r.commissionTnd).toFixed(0)} TND à l'hôtel
                </div>
                {r.discount && r.discount.discountPct > 0 && (
                  <div className="text-xs bg-green-50 text-green-700 border border-green-100 rounded px-2 py-0.5 mt-1">
                    Remise {r.discount.discountPct}% accordée
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
