import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tunisia Tonight — Courts séjours en Tunisie',
  description: 'Réservez votre court séjour dans les meilleurs hôtels tunisiens. Paiement en Dinars Tunisiens.',
  keywords: 'hôtel tunisie, réservation hôtel tunisie, court séjour tunisie, TND',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
