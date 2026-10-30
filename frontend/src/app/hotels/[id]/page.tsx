'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { hotelsApi } from '@/lib/api';
import { MEAL_PLAN_LABELS, MealPlan } from '@/types';
import { MapPin, Star, Users, Coffee, Wifi, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

function StarsRow({ count }: { count: number }) {
  return <span className="flex">{Array.from({ length: count }).map((_, i) => <Star key={i} className="w-4 h-4 text-brand-500 fill-brand-500" />)}</span>;
}

const AMENITY_ICONS: Record<string, string> = {
  piscine: '🏊', spa: '💆', thalasso: '🌊', wifi: '📶',
  parking: '🅿️', restaurant: '🍽️', plage_privee: '🏖️',
  golf: '⛳', animation: '🎭', climatisation: '❄️',
};

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const adults = Number(searchParams.get('adults') || 2);

  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealPlan>('BREAKFAST');
  const [activePhoto, setActivePhoto] = useState(0);

  const nights = checkin && checkout
    ? Math.ceil((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000)
    : 0;

  useEffect(() => {
    hotelsApi.findOne(id, checkin, checkout)
      .then(({ data }) => { setHotel(data); })
      .catch(() => toast.error('Hôtel introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = () => {
    if (!selectedRoom) return toast.error('Sélectionnez une chambre');
    const rate = selectedRoom.contractRates?.find((r: any) => r.mealPlan === selectedMeal);
    if (!rate) return toast.error('Tarif indisponible pour ce plan repas');

    const params = new URLSearchParams({
      hotelId: id,
      roomTypeId: selectedRoom.id,
      rateId: rate.id,
      checkin, checkout,
      adults: String(adults),
      mealPlan: selectedMeal,
    });
    router.push(`/reservation?${params.toString()}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!hotel) return null;

  const allPhotos = hotel.photos || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Galerie photos */}
      <div className="bg-black h-72 md:h-96 relative overflow-hidden">
        {allPhotos.length > 0 ? (
          <img src={allPhotos[activePhoto]} alt={hotel.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-8xl">🏨</div>
        )}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {allPhotos.map((_: string, i: number) => (
              <button key={i} onClick={() => setActivePhoto(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activePhoto ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* COLONNE GAUCHE — infos hôtel */}
          <div className="lg:col-span-2 space-y-6">
            {/* En-tête */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-black text-navy-500">{hotel.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <StarsRow count={hotel.stars} />
                    <span className="text-gray-400 text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{hotel.city}{hotel.address && ` · ${hotel.address}`}</span>
                  </div>
                </div>
              </div>
              {hotel.description && <p className="text-gray-600 text-sm leading-relaxed mt-3">{hotel.description}</p>}
            </div>

            {/* Équipements */}
            <div className="card p-6">
              <h2 className="font-bold text-navy-500 mb-4">Équipements & services</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(hotel.amenities as string[]).map((a: string) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    <span>{AMENITY_ICONS[a] || '✓'}</span>
                    <span className="capitalize">{a.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chambres disponibles */}
            <div className="card p-6">
              <h2 className="font-bold text-navy-500 mb-4">Choisissez votre chambre</h2>
              {!checkin || !checkout ? (
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-700">
                  Sélectionnez vos dates pour voir les disponibilités et tarifs.
                </div>
              ) : (
                <div className="space-y-4">
                  {hotel.roomTypes?.map((room: any) => {
                    const rate = room.contractRates?.find((r: any) => r.mealPlan === selectedMeal);
                    const isSelected = selectedRoom?.id === room.id;
                    const isAvailable = nights > 0 && (room.availabilities?.length >= nights);

                    return (
                      <div
                        key={room.id}
                        onClick={() => isAvailable && setSelectedRoom(room)}
                        className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                          isSelected ? 'border-brand-500 bg-brand-50' :
                          isAvailable ? 'border-gray-100 bg-white hover:border-brand-200' :
                          'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-navy-500">{room.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                              {!isAvailable && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Complet</span>}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-3">
                              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Max {room.capacity} pers.</span>
                              {room.bedType && <span>🛏️ {room.bedType}</span>}
                              {room.viewType && <span>👁️ Vue {room.viewType}</span>}
                            </div>
                          </div>
                          {rate && isAvailable && (
                            <div className="text-right ml-4">
                              <div className="text-xl font-black text-brand-600">{rate.basePriceTnd} TND<span className="text-xs font-normal text-gray-400">/nuit</span></div>
                              <div className="text-xs text-gray-400">{(rate.basePriceTnd * nights).toFixed(0)} TND total</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE — récap réservation */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="font-bold text-navy-500 mb-4">Votre séjour</h3>

              {checkin && checkout ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Arrivée</span><strong>{new Date(checkin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</strong>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Départ</span><strong>{new Date(checkout).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</strong>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Durée</span><strong>{nights} nuit{nights > 1 ? 's' : ''}</strong>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Voyageurs</span><strong>{adults} adulte{adults > 1 ? 's' : ''}</strong>
                  </div>

                  {/* Plan repas */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Plan repas</label>
                    <select className="input text-sm" value={selectedMeal} onChange={e => setSelectedMeal(e.target.value as MealPlan)}>
                      {Object.entries(MEAL_PLAN_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {selectedRoom && (
                    <>
                      {(() => {
                        const rate = selectedRoom.contractRates?.find((r: any) => r.mealPlan === selectedMeal);
                        if (!rate) return null;
                        const total = rate.basePriceTnd * nights;
                        const commission = Math.round(total * rate.commissionPct / 100 * 100) / 100;
                        return (
                          <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-gray-600 text-xs">
                              <span>Tarif contrat / nuit</span><span>{rate.basePriceTnd} TND</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-xs">
                              <span>Total séjour ({nights} nuits)</span><span>{total.toFixed(0)} TND</span>
                            </div>
                            <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 mt-2">
                              <div className="flex justify-between text-xs font-semibold text-brand-700 mb-1">
                                <span>✦ Commission Tunisia Tonight</span><span>{commission.toFixed(0)} TND</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>À régler à l'hôtel</span><span>{(total - commission).toFixed(0)} TND</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={!selectedRoom}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                  >
                    Réserver <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-400 text-center">Aucun débit sans confirmation hôtel</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  Sélectionnez vos dates de séjour pour voir les tarifs et réserver.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
