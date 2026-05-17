import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LayoutDashboard, Utensils, ClipboardList, Settings, Bell, Search } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NexOrder Admin',
  description: 'Gestão de Restaurante NexOrder',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full bg-slate-100 text-slate-900 antialiased`}>
        <div className="flex h-full">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-20">
            <div className="p-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg" />
              <div className="text-xl font-black tracking-tight text-slate-900">NexAdmin</div>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              <Link href="/" className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 text-white font-medium transition-all shadow-lg shadow-slate-200">
                <LayoutDashboard size={20} /> Dashboard
              </Link>
              <Link href="/products" className="flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium">
                <Utensils size={20} /> Produtos
              </Link>
              <Link href="/orders" className="flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium">
                <ClipboardList size={20} /> Pedidos
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium mt-10">
                <Settings size={20} /> Configurações
              </Link>
            </nav>

            <div className="p-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">CS</div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Clecio Santos</span>
                <span className="text-xs text-slate-400">Owner</span>
              </div>
            </div>
          </aside>

          {/* Main Container */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header / Top Bar */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Buscar pedidos ou produtos..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative">
                  <Bell size={22} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
