import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Clock } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bora De Delivery Kitchen',
  description: 'Painel de Produção Realtime',
};

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full bg-slate-950 overflow-hidden">
      <body className={`${inter.className} h-full text-slate-50`}>
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xl font-black text-yellow-500 italic uppercase">
            <span className="bg-yellow-500 text-slate-950 px-2 rounded">Nex</span>
            Cozinha
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock size={20} />
              <span className="font-mono text-lg tracking-widest uppercase">Operação Ativa</span>
            </div>
          </div>
        </header>
        <main className="h-[calc(100vh-4rem)] p-6 overflow-hidden">{children}</main>
      </body>
    </html>
  );
}