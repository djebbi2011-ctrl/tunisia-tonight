'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { reservationsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { MEAL_PLAN_LABELS, MealPlan } from '@/types';
import { User, CreditCard, CheckCircle, Loader2, ArrowLeft, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Séjour', 'Vos coordonnées', 'Paiement'];

export default function ReservationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const hotelId    = searchParams.get('hotelId') || '';
  const roomTypeId = searchParams.get('roomTypeId') || '';
  const checkin    = searchParams.get('checkin') || '';
  const checkout   = searchParams.get('checkout') || '';
  const adults     = Number(searchParams.get('adults') || 2);
  const mealPlan   = (searchParams.get('mealPlan') || 'BREAKFAST') as MealPlan;
  const nights     = checkin && checkout
    ? Math.ceil((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000)
    : 0;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<any>(null);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    phone:     '',
    cinPassport: '',
    specialRequests: '',
  });

  // Calcul indicatif (sera recalculé par le backend)
  const estimatedBase    = 250 * nights; // placeholder
  const estimatedComm    = Math.round(estimatedBase * 0.08 * 100) / 100;
  const estimatedBalance = estimatedBase - estimatedComm;

  const handleSubmitReservation = async () => {
    if (!isAuthenticated) { toast.error('Connectez-vous pour réserver'); router.push('/login'); return; }
    setLoading(true);
    try {
      const { data } = await reservationsApi.create({
        hotelId, roomTypeId, checkin, checkout, adults,
        children: 0, mealPlan, specialRequests: form.specialRequests,
      });
      setReservation(data);
      setStep(2);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const handlePayCommission = async () => {
    if (!reservation) return;
    toast.success('Redirection vers la passerelle de paiement TND...');
    // TODO: intégration Paymee / Konnect
    setTimeout(() => router.push('/account'), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
                ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-navy-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`ml-2 text-sm font-semibold ${i === step ? 'text-navy-500' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* ÉTAPE 0 — Récap séjour */}
        {step === 0 && (
          <div className="card p-8 space-y-6">
            <h2 className="text-xl font-black text-navy-500">Récapitulatif du séjour</h2>
            <div className="bg-navy-50 rounded-xl p-5 space-y-2 text-sm">
              <Row label="Dates"        value={`${fmtDate(checkin)} → ${fmtDate(checkout)} (${nights} nuit${nights>1?'s':''})`} />
              <Row label="Voyageurs"    value={`${adults} adulte${adults>1?'s':''}`} />
              <Row label="Plan repas"   value={MEAL_PLAN_LABELS[mealPlan]} />
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 space-y-2 text-sm">
              <p className="font-bold text-brand-700 mb-2">💳 Résumé financier</p>
              <Row label="Commission Tunisia Tonight (à payer maintenant)" value={`~ ${estimatedComm} TND`} highlight />
              <Row label="Solde à régler directement à l'hôtel"            value={`~ ${estimatedBalance} TND`} />
              <p className="text-xs text-gray-500 mt-2">* Le montant exact sera calculé après validation de votre chambre et plan repas.</p>
            </div>
            <button onClick={() => setStep(1)} className="btn-primary w-full flex items-center justify-center gap-2">
              Continuer <User className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ÉTAPE 1 — Identité */}
        {step === 1 && (
          <div className="card p-8 space-y-5">
            <h2 className="text-xl font-black text-navy-500">Vos coordonnées</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Prénom *</label>
                <input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Nom *</label>
                <input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Email *</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Téléphone *</label>
                <input className="input" placeholder="+216 XX XXX XXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">CIN / Passeport</label>
                <input className="input" value={form.cinPassport} onChange={e => setForm({...form, cinPassport: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Demandes spéciales (optionnel)</label>
              <textarea className="input resize-none" rows={3} placeholder="Lit bébé, vue mer, arrivée tardive..." value={form.specialRequests} onChange={e => setForm({...form, specialRequests: e.target.value})} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Retour</button>
              <button
                onClick={handleSubmitReservation}
                disabled={loading || !form.firstName || !form.lastName || !form.email}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Continuer vers le paiement
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Paiement commission */}
        {step === 2 && reservation && (
          <div className="card p-8 space-y-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-xl font-black text-navy-500">Dossier {reservation.reservation.reference} créé !</h2>
              <p className="text-gray-500 text-sm mt-1">Payez la commission Tunisia Tonight pour finaliser votre demande.</p>
            </div>

            <div className="bg-navy-50 rounded-xl p-5 space-y-2 text-sm">
              <Row label="Référence dossier"     value={reservation.reservation.reference} />
              <Row label="Tarif séjour (contrat)" value={`${reservation.reservation.contractPriceTnd} TND`} />
            </div>

            <div className="rounded-xl overflow-hidden border-2 border-brand-500">
              <div className="bg-brand-500 text-white px-5 py-3 font-bold text-sm">À payer maintenant — Commission Tunisia Tonight</div>
              <div className="bg-brand-50 px-5 py-4">
                <div className="text-3xl font-black text-brand-700">{reservation.paymentSummary.commissionTnd} TND</div>
                <p className="text-xs text-brand-600 mt-1">Paiement sécurisé · Carte bancaire / D17 / Konnect</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600">
              <p className="font-semibold mb-1">📋 À régler directement à l'hôtel</p>
              <p className="text-2xl font-black text-navy-500">{reservation.paymentSummary.hotelBalanceTnd.toFixed(0)} TND</p>
              <p className="text-xs text-gray-400 mt-1">À payer à la réception lors de votre arrivée ou départ</p>
            </div>

            <button onClick={handlePayCommission} className="btn-primary w-full flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Payer {reservation.paymentSummary.commissionTnd} TND maintenant
            </button>
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Paiement sécurisé SSL · Tunisia Tonight ne stocke aucune donnée bancaire
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-brand-700' : 'text-navy-500'}`}>{value}</span>
    </div>
  );
}

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';
}
