'use client';
import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import { hotelierApi } from '@/lib/api';
import { MEAL_PLAN_LABELS, RESERVATION_STATUS_LABELS } from '@/types';
import { CheckCircle, XCircle, Calendar, Users, TrendingUp, Clock, Loader2, RefreshCw, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

type Tab = 'dashboard' | 'dossiers' | 'calendrier';

export default function ExtranetPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [discountInputs, setDiscountInputs] = useState<Record<string, number>>({});
  const [validating, setValidating] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [dashRes, resaRes] = await Promise.all([
        hotelierApi.dashboard(),
        hotelierApi.reservations(),
      ]);
      setDashboard(dashRes.data);
      setReservations(resaRes.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  // WebSocket temps réel
  useEffect(() => {
    const token = localStorage.getItem('tn_access_token');
    if (!token) return;
    const ws = io(`${process.env.NEXT_PUBLIC_WS_URL}/realtime`, {
      auth: { token },
      transports: ['websocket'],
    });
    ws.on('connect', () => { setIsConnected(true); ws.emit('join:hotel', dashboard?.hotelId); });
    ws.on('disconnect', () => setIsConnected(false));
    ws.on('reservation:new', () => { toast.success('🔔 Nouvelle réservation !'); loadData(); });
    ws.on('reservation:cancelled', () => { toast('Réservation annulée', { icon: '⚠️' }); loadData(); });
    ws.on('availability:update', () => loadData());
    setSocket(ws);
    return () => { ws.disconnect(); };
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleValidate = async (reservationId: string, action: 'validate' | 'refuse', refusedReason?: string) => {
    setValidating(reservationId);
    const discountPct = discountInputs[reservationId] || 0;
    try {
      await hotelierApi.validate(reservationId, { action, discountPct, refusedReason });
      toast.success(action === 'validate' ? '✅ Dossier validé' : '❌ Dossier refusé');
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur');
    } finally {
      setValidating(null);
    }
  };

  const pending = reservations.filter(r => r.status === 'PAID');
  const validated = reservations.filter(r => r.status === 'VALIDATED');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header extranet */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-navy-500">Extranet Hôtelier</h1>
            <p className="text-gray-500 text-sm">{dashboard?.hotelId ? 'Hôtel connecté' : 'Chargement...'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border
              ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              {isConnected ? 'Temps réel actif' : 'Reconnexion...'}
            </div>
            <button onClick={loadData} className="p-2 text-gray-400 hover:text-navy-500 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-6 w-fit shadow-sm">
          {(['dashboard','dossiers','calendrier'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all
                ${tab === t ? 'bg-navy-500 text-white shadow' : 'text-gray-500 hover:text-navy-500'}`}>
              {t === 'dashboard' ? '📊 Dashboard' : t === 'dossiers' ? '📋 Dossiers' : '📅 Calendrier'}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-600 animate-spin" /></div>}

        {/* DASHBOARD */}
        {!loading && tab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Arrivées aujourd\'hui', value: dashboard.todayArrivals, icon: <Users className="w-5 h-5 text-blue-500" />, color: 'blue' },
                { label: 'Départs aujourd\'hui',  value: dashboard.todayDepartures, icon: <Calendar className="w-5 h-5 text-purple-500" />, color: 'purple' },
                { label: 'En attente validation', value: dashboard.pendingValidation, icon: <Clock className="w-5 h-5 text-yellow-500" />, color: 'yellow' },
                { label: 'CA Tunisia Tonight (mois)', value: `${dashboard.monthRevenueTnd} TND`, icon: <TrendingUp className="w-5 h-5 text-green-500" />, color: 'green' },
              ].map((stat, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center gap-3 mb-2">{stat.icon}<span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{stat.label}</span></div>
                  <div className="text-3xl font-black text-navy-500">{stat.value}</div>
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-navy-500 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" /> {pending.length} dossier{pending.length > 1 ? 's' : ''} en attente de validation
                </h3>
                <p className="text-xs text-gray-500 mb-4">Validez ou refusez ces demandes. Vous pouvez accorder une remise optionnelle (visible par l'admin Tunisia Tonight).</p>
                <div className="space-y-3">
                  {pending.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-4 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                      <div className="flex-1">
                        <div className="font-mono text-xs text-gray-400">#{r.reference}</div>
                        <div className="font-bold text-navy-500">{r.client?.firstName} {r.client?.lastName}</div>
                        <div className="text-xs text-gray-500">{r.roomType?.name} · {new Date(r.checkin).toLocaleDateString('fr-FR')} → {new Date(r.checkout).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div className="text-right font-bold text-navy-500 text-sm">{r.contractPriceTnd} TND</div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input type="number" min={0} max={50} placeholder="0"
                            className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center pr-6"
                            value={discountInputs[r.id] || ''}
                            onChange={e => setDiscountInputs({...discountInputs, [r.id]: Number(e.target.value)})} />
                        </div>
                        <button onClick={() => handleValidate(r.id, 'validate')} disabled={validating === r.id}
                          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                          {validating === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Valider
                        </button>
                        <button onClick={() => handleValidate(r.id, 'refuse', 'Indisponible')} disabled={validating === r.id}
                          className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DOSSIERS */}
        {!loading && tab === 'dossiers' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy-500 text-white">
                  <tr>{['Dossier','Client','Dates','Chambre','Tarif contrat','Remise','Net client','Statut','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reservations.map((r, i) => {
                    const isPending = r.status === 'PAID';
                    const discount = r.discount;
                    return (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.reference}</td>
                        <td className="px-4 py-3"><div className="font-semibold text-navy-500">{r.client?.firstName} {r.client?.lastName}</div><div className="text-xs text-gray-400">{r.client?.phone}</div></td>
                        <td className="px-4 py-3 text-xs">{new Date(r.checkin).toLocaleDateString('fr-FR')} → {new Date(r.checkout).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3 text-xs">{r.roomType?.name}</td>
                        <td className="px-4 py-3 font-semibold text-navy-500">{r.contractPriceTnd} TND</td>
                        <td className="px-4 py-3">
                          {discount ? (
                            <span className="text-red-600 font-bold text-xs">-{discount.discountPct}%<br/><span className="text-gray-400">({discount.discountTnd} TND)</span></span>
                          ) : isPending ? (
                            <input type="number" min={0} max={50} placeholder="0%"
                              className="w-14 border rounded px-1 py-0.5 text-xs text-center"
                              value={discountInputs[r.id] || ''}
                              onChange={e => setDiscountInputs({...discountInputs, [r.id]: Number(e.target.value)})} />
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 font-bold text-green-700 text-xs">
                          {discount ? `${discount.netPriceTnd} TND` : `${r.contractPriceTnd} TND`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                            ${r.status === 'VALIDATED' ? 'bg-green-100 text-green-700' :
                              r.status === 'PAID' ? 'bg-yellow-100 text-yellow-700' :
                              r.status === 'REFUSED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.status === 'PAID' ? '⏳ À valider' : r.status === 'VALIDATED' ? '✅ Validé' : r.status === 'REFUSED' ? '❌ Refusé' : r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isPending && (
                            <div className="flex gap-1">
                              <button onClick={() => handleValidate(r.id, 'validate')} disabled={validating === r.id}
                                className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold hover:bg-green-600">✓</button>
                              <button onClick={() => handleValidate(r.id, 'refuse', 'Complet')} disabled={validating === r.id}
                                className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold hover:bg-red-200">✗</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CALENDRIER placeholder */}
        {!loading && tab === 'calendrier' && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="font-bold text-navy-500 mb-2">Calendrier des disponibilités</h3>
            <p className="text-gray-500 text-sm">Module en cours d'intégration — Phase 2</p>
          </div>
        )}
      </div>
    </div>
  );
}
