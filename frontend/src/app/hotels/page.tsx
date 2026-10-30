'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { hotelsApi } from '@/lib/api';

interface HotelResult {
  id: string;
  name: string;
  city: string;
  stars: number;
  amenities: Record<string, boolean>;
  photos: string[];
  cheapestRate: { basePriceTnd: number; commissionPct: number; mealPlan: string } | null;
}

const PRODUCT_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  nuit: { label: 'Nuits dernière minute', icon: '🌙', desc: 'Chambres disponibles ce soir' },
  daypass: { label: 'Day Pass', icon: '☀️', desc: 'Accès piscine, spa, plage à la journée' },
};

function HotelCard({ hotel, type }: { hotel: HotelResult; type: string }) {
  const rate = hotel.cheapestRate;
  const commission = rate ? Math.round(rate.basePriceTnd * rate.commissionPct / 100) : 0;
  const total = rate ? rate.basePriceTnd + commission : 0;

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="h-48 bg-gradient-to-br from-navy-800 to-navy-600 relative">
          {hotel.photos?.[0] ? (
            <img src={hotel.photos[0]} alt={hotel.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🏨</div>
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
              {[...Array(hotel.stars)].map((_, i) => <span key={i}>★</span>)}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-navy-900">{hotel.name}</h3>
          <p className="text-sm text-gray-500 mb-3">📍 {hotel.city}</p>
          {rate ? (
            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-400">Commission Tunisia Tonight</p>
                  <p className="text-brand-600 font-bold">{commission} TND</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Prix total estimé</p>
                  <p className="text-navy-900 font-bold text-lg">{total} TND</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Contacter pour tarif</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function HotelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'nuit';
  const city = searchParams.get('city') || '';
  const date = searchParams.get('date') || '';
  const guests = searchParams.get('guests') || '2';

  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState<number | null>(null);

  const product = PRODUCT_LABELS[type] || PRODUCT_LABELS.nuit;

  useEffect(() => {
    setLoading(true);
    hotelsApi
      .search({ city, checkin: date, checkout: date, adults: guests, type })
      .then((r) => setHotels(r.data))
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, [type, city, date, guests]);

  const filtered = stars ? hotels.filter((h) => h.stars === stars) : hotels;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-900 text-white py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-white mb-3 block">
            ← Retour
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{product.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{product.label}</h1>
              <p className="text-gray-400 text-sm">
                {product.desc}
                {city && ` — ${city}`}
                {date && ` · ${new Date(date).toLocaleDateString('fr-TN')}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Filters */}
        <aside className="w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Catégorie</h3>
            <div className="space-y-2">
              <button
                onClick={() => setStars(null)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${!stars ? 'bg-navy-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                Tous
              </button>
              {[5, 4, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setStars(s === stars ? null : s)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${stars === s ? 'bg-navy-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {'★'.repeat(s)} {s} étoiles
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">{product.icon}</p>
              <p className="font-medium">Aucune offre disponible pour cette recherche</p>
              <p className="text-sm mt-1">Essayez une autre destination ou une autre date</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{filtered.length} établissement(s) trouvé(s)</p>
              <div className="grid md:grid-cols-2 gap-5">
                {filtered.map((h) => <HotelCard key={h.id} hotel={h} type={type} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Chargement…</p></div>}>
      <HotelsContent />
    </Suspense>
  );
}
