'use client';
import { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Contract {
  id: string;
  label: string;
  status: string;
  seasonStart: string;
  seasonEnd: string;
  fileUrl: string | null;
  hotel: { id: string; name: string; city: string };
  rates: { id: string; roomType: { name: string }; mealPlan: string; basePriceTnd: number; commissionPct: number }[];
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const load = () => {
    adminApi.getContracts().then(setContracts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !uploadTarget) return;
    setUploading(uploadTarget);
    try {
      await adminApi.uploadContractFile(uploadTarget, e.target.files[0]);
      toast.success('Fichier uploadé avec succès');
      load();
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(null);
      setUploadTarget(null);
      e.target.value = '';
    }
  };

  const activate = async (id: string) => {
    await adminApi.activateContract(id);
    toast.success('Contrat activé');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Contrats</h2>
          <p className="text-gray-500 mt-1">Tarifs négociés avec les hôteliers</p>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls" className="hidden" onChange={handleUpload} />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{c.label}</p>
                    <p className="text-sm text-gray-500">
                      {c.hotel.name} — {c.hotel.city} &nbsp;|&nbsp;
                      {new Date(c.seasonStart).toLocaleDateString('fr-TN')} →{' '}
                      {new Date(c.seasonEnd).toLocaleDateString('fr-TN')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[c.status]}`}>
                    {c.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {c.fileUrl ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${c.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      📎 Voir fichier
                    </a>
                  ) : (
                    <button
                      onClick={() => { setUploadTarget(c.id); fileRef.current?.click(); }}
                      disabled={uploading === c.id}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                    >
                      {uploading === c.id ? '⏳ Upload…' : '📤 Charger fichier'}
                    </button>
                  )}
                  {c.status === 'DRAFT' && (
                    <button
                      onClick={() => activate(c.id)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition"
                    >
                      ✅ Activer
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    {expanded === c.id ? '▲ Masquer' : '▼ Tarifs'}
                  </button>
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                        <th className="pb-2">Chambre</th>
                        <th className="pb-2">Pension</th>
                        <th className="pb-2">Prix contrat</th>
                        <th className="pb-2">Commission</th>
                        <th className="pb-2">Prix client</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {c.rates.map((r) => {
                        const commission = Math.round(r.basePriceTnd * r.commissionPct / 100);
                        return (
                          <tr key={r.id}>
                            <td className="py-2 font-medium">{r.roomType.name}</td>
                            <td className="py-2 text-gray-600">{r.mealPlan}</td>
                            <td className="py-2">{r.basePriceTnd} TND</td>
                            <td className="py-2 text-brand-600 font-medium">{commission} TND ({r.commissionPct}%)</td>
                            <td className="py-2 font-semibold">{r.basePriceTnd + commission} TND</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {contracts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📄</p>
              <p>Aucun contrat chargé pour le moment</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
