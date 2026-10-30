'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, Search } from 'lucide-react';

const TUNISIAN_CITIES = [
  'Hammamet', 'Sousse', 'Monastir', 'Djerba', 'Tabarka',
  'Tunis', 'Nabeul', 'Mahdia', 'El Kantaoui', 'Tozeur', 'Sfax',
];

export default function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleCityInput = (val: string) => {
    setCity(val);
    if (val.length >= 2) {
      setSuggestions(TUNISIAN_CITIES.filter((c) => c.toLowerCase().includes(val.toLowerCase())));
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !checkin || !checkout) return;
    const params = new URLSearchParams({ city, checkin, checkout, adults: String(adults), children: String(children) });
    router.push(`/hotels?${params.toString()}`);
  };

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
        <div className="flex items-center gap-2 px-3 flex-1">
          <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <input className="outline-none text-sm w-full" placeholder="Destination" value={city} onChange={e => handleCityInput(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 px-3 border-l border-gray-100">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input type="date" className="outline-none text-sm w-28" min={today} value={checkin} onChange={e => setCheckin(e.target.value)} />
          <span className="text-gray-300">→</span>
          <input type="date" className="outline-none text-sm w-28" min={checkin || tomorrow} value={checkout} onChange={e => setCheckout(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary py-2 px-4 rounded-xl flex items-center gap-2 text-sm">
          <Search className="w-4 h-4" /> Rechercher
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Destination */}
        <div className="relative md:col-span-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Destination</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
            <input
              className="input pl-9"
              placeholder="Hammamet, Djerba..."
              value={city}
              onChange={(e) => handleCityInput(e.target.value)}
              required
            />
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-10 mt-1">
                {suggestions.map((s) => (
                  <li
                    key={s}
                    className="px-4 py-2 text-sm hover:bg-brand-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { setCity(s); setSuggestions([]); }}
                  >
                    <MapPin className="w-3 h-3 text-brand-500" /> {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Arrivée</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="date" className="input pl-9" min={today} value={checkin} onChange={(e) => setCheckin(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Départ</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="date" className="input pl-9" min={checkin || tomorrow} value={checkout} onChange={(e) => setCheckout(e.target.value)} required />
          </div>
        </div>

        {/* Voyageurs */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Voyageurs</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select className="input pl-9 appearance-none" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} adulte{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button type="submit" className="btn-primary flex items-center gap-3 px-10 py-4 text-base rounded-xl">
          <Search className="w-5 h-5" />
          Rechercher des hôtels
        </button>
      </div>
    </form>
  );
}
