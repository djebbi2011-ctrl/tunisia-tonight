'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Moon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Bienvenue !');
      // Redirection selon le rôle
      const user = useAuthStore.getState().user;
      if (user?.role === 'HOTELIER') router.push('/extranet');
      else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') router.push('/admin');
      else router.push('/');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Moon className="w-6 h-6 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-black text-navy-500">Tunisia<span className="text-brand-600">Tonight</span></h1>
          <p className="text-gray-500 text-sm mt-1">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Email</label>
            <input type="email" className="input" placeholder="vous@email.tn" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Mot de passe</label>
            <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Se connecter
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-brand-600 font-semibold hover:underline">S'inscrire</Link>
        </p>

        {/* Comptes test */}
        <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700 mb-1">🧪 Comptes de test :</p>
          <p>Client : sonia@test.tn / Client@2026!</p>
          <p>Hôtelier : barcelo@tunisiatonight.com / Hotelier@2026!</p>
          <p>Admin : admin@tunisiatonight.com / Admin@2026!</p>
        </div>
      </div>
    </div>
  );
}
