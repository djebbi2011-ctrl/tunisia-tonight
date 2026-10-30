'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CITIES = ['Tunis', 'Hammamet', 'Sousse', 'Monastir', 'Djerba', 'Tabarka', 'Tozeur', 'Mahdia'];

type ProductType = 'nuit' | 'daypass';

const PRODUCTS = [
  {
    id: 'nuit' as ProductType,
    icon: '🌙',
    label: 'Nuit dernière minute',
    desc: 'Chambres disponibles ce soir à prix réduit',
    color: 'from-navy-800 to-navy-900',
    accent: 'brand-400',
  },
  {
    id: 'daypass' as ProductType,
    icon: '☀️',
    label: 'Day Pass',
    desc: 'Piscine, spa, plage — sans dormir',
    color: 'from-blue-600 to-blue-800',
    accent: 'blue-300',
  },
];

const WHY = [
  { icon: '💰', title: 'Prix négociés en dinars', desc: 'Tarifs contrat exclusifs, jamais affichés publiquement.' },
  { icon: '⚡', title: 'Réservation en 2 minutes', desc: 'Commission payée en ligne, le reste directement à l\'hôtel.' },
  { icon: '🤝', title: 'Hôtels vérifiés', desc: 'Tous nos partenaires sont sélectionnés et sous contrat.' },
  { icon: '📱', title: 'Application mobile (bientôt)', desc: 'Sur App Store & Google Play très prochainement.' },
];

export default function HomePage() {
  const router = useRouter();
  const [activeProduct, setActiveProduct] = useState<ProductType>('nuit');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [cityInput, setCityInput] = useState('');
  const [showCities, setShowCities] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = () => {
    const params = new URLSearchParams({
      type: activeProduct,
      city: city || cityInput,
      date: date || today,
      guests: guests.toString(),
    });
    router.push(`/hotels?${params.toString()}`);
  };

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(cityInput.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">

      {/* HERO */}
      <section className="relative bg-navy-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-10">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Tunisie Tonight
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Vos prochaines heures<br />en Tunisie, réservées<br />
            <span className="text-brand-400">maintenant.</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-xl">
            Nuits de dernière minute, day pass piscine & spa, séjours mystère —
            aux meilleurs tarifs négociés en dinars.
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className="relative max-w-5xl mx-auto px-6 pb-16">

          {/* Product tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProduct(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeProduct === p.id
                    ? 'bg-brand-500 text-white shadow-lg scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          {/* Search form */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row gap-3 items-end">
            {/* City */}
            <div className="flex-1 relative">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
                Destination
              </label>
              <input
                type="text"
                placeholder="Hammamet, Djerba, Sousse…"
                value={cityInput}
                onChange={(e) => { setCityInput(e.target.value); setShowCities(true); setCity(''); }}
                onFocus={() => setShowCities(true)}
                onBlur={() => setTimeout(() => setShowCities(false), 150)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              {showCities && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 overflow-hidden">
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      onMouseDown={() => { setCity(c); setCityInput(c); setShowCities(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-brand-50 text-sm text-gray-700"
                    >
                      📍 {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
                {activeProduct === 'daypass' ? 'Date' : 'Arrivée'}
              </label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {/* Guests */}
            <div className="w-32">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
                Personnes
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} pers.</option>)}
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/30 whitespace-nowrap"
            >
              Chercher →
            </button>
          </div>
        </div>
      </section>

      {/* 3 PRODUCTS */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-navy-900 mb-2 text-center">Nos offres exclusives</h2>
        <p className="text-gray-500 text-center mb-10">Pensées pour les Tunisiens qui veulent profiter, maintenant.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {PRODUCTS.map((p) => (
            <div
              key={p.id}
              className={`bg-gradient-to-br ${p.color} rounded-2xl p-6 text-white cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => { setActiveProduct(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <span className="text-4xl block mb-4">{p.icon}</span>
              <h3 className="text-xl font-bold mb-2">{p.label}</h3>
              <p className="text-white/70 text-sm">{p.desc}</p>
              <div className="mt-4 text-sm font-semibold underline underline-offset-2 opacity-80">
                Réserver →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-navy-900 mb-10 text-center">Comment ça marche</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '1', t: 'Tu choisis', d: 'Destination, type d\'offre, date et nombre de personnes.' },
              { n: '2', t: 'Tu paies la commission', d: 'Un petit montant en ligne — notre commission Tunisia Tonight en TND.' },
              { n: '3', t: 'Tu profites', d: 'Tu règles le reste directement à l\'hôtel à l\'arrivée.' },
            ].map((step) => (
              <div key={step.n} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <h4 className="font-semibold text-navy-900 mb-1">{step.t}</h4>
                  <p className="text-gray-500 text-sm">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-navy-900 mb-10 text-center">Pourquoi Tunisia Tonight ?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {WHY.map((w) => (
            <div key={w.title} className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <span className="text-3xl">{w.icon}</span>
              <div>
                <h4 className="font-semibold text-navy-900 mb-1">{w.title}</h4>
                <p className="text-gray-500 text-sm">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PARTENAIRES CTA */}
      <section className="bg-navy-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Vous êtes hôtelier ?</p>
          <h2 className="text-3xl font-bold mb-4">Remplissez vos chambres de ce soir.</h2>
          <p className="text-gray-300 mb-8">
            Zéro abonnement. Commission uniquement sur les ventes réalisées.
            Testez 2 à 3 mois sans engagement.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/extranet"
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 rounded-xl font-semibold transition"
            >
              Accéder à l'extranet
            </Link>
            <a
              href="mailto:contact@tunisiatonight.com"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="font-semibold text-white">🌙 Tunisia Tonight</p>
          <p>© 2026 Tunisia Tonight — Tous droits réservés</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-white transition">Connexion</Link>
            <Link href="/extranet" className="hover:text-white transition">Extranet hôteliers</Link>
            <Link href="/admin" className="hover:text-white transition">Admin</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
