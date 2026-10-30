'use client';
import Link from 'next/link';
import { MapPin, Star, Coffee, Sunset } from 'lucide-react';
import { SearchResult, MEAL_PLAN_LABELS } from '@/types';

interface Props {
  hotel: SearchResult;
  checkin: string;
  checkout: string;
  adults: number;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 text-brand-500 fill-brand-500" />
      ))}
    </span>
  );
}

export default function HotelCard({ hotel, checkin, checkout, adults }: Props) {
  const rate = hotel.cheapestRate;
  const nights = hotel.nights;
  const params = new URLSearchParams({ checkin, checkout, adults: String(adults) });

  const photoUrl = hotel.photos[0] || null;
  const amenityIcons: Record<string, string> = {
    piscine: '🏊', spa: '💆', plage_privee: '🏖️', wifi: '📶',
    restaurant: '🍽️', golf: '⛳', animation: '🎭', thalasso: '🌊',
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row">
      {/* Photo */}
      <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 bg-gradient-to-br from-navy-500 to-blue-700 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">🏨</span>
        )}
        {/* Badge nb nuits */}
        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">
          {nights} nuit{nights > 1 ? 's' : ''}
        </div>
      </div>

      {/* Infos */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-bold text-lg text-navy-500 leading-tight">{hotel.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Stars count={hotel.stars} />
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" /> {hotel.city}
                </span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {(hotel.amenities as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(hotel.amenities as string[]).slice(0, 5).map((a) => (
                <span key={a} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                  {amenityIcons[a] || '✓'} {a.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Chambre disponible */}
          <div className="text-sm text-gray-600 flex items-center gap-1.5">
            <Coffee className="w-4 h-4 text-brand-500" />
            {rate.name} · {MEAL_PLAN_LABELS[rate.mealPlan]}
            {rate.minStay > 1 && <span className="text-gray-400 ml-1">· min {rate.minStay} nuits</span>}
          </div>
        </div>

        {/* Prix + CTA */}
        <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
          <div>
            <div className="text-2xl font-black text-brand-600">
              {rate.basePriceTnd.toFixed(0)} TND
              <span className="text-sm font-normal text-gray-400 ml-1">/ nuit</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Total {rate.totalTnd.toFixed(0)} TND · Commission {rate.commissionTnd.toFixed(0)} TND
            </div>
          </div>
          <Link
            href={`/hotels/${hotel.id}?${params.toString()}`}
            className="btn-primary text-sm py-2.5 px-5 rounded-xl"
          >
            Voir les chambres →
          </Link>
        </div>
      </div>
    </div>
  );
}
