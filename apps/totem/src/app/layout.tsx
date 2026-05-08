import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexOrder",
  description: "Sistema de Autoatendimento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-zinc-100 text-zinc-900 antialiased overflow-hidden">
        <main className="w-screen h-screen flex flex-col">
          {/* HEADER */}
          <header className="h-24 bg-white border-b border-zinc-200 flex items-center justify-between px-10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center text-2xl font-bold">
                N
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  NexOrder
                </h1>

                <p className="text-sm text-zinc-500">
                  Autoatendimento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 transition text-lg font-medium">
                Português
              </button>

              <button className="px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 transition text-lg font-medium">
                EN
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <section className="flex-1 overflow-auto">
            {children}
          </section>

          {/* FOOTER / CART BAR */}
          <footer className="h-28 bg-white border-t border-zinc-200 flex items-center justify-between px-10 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col">
              <span className="text-sm text-zinc-500">
                Total do Pedido
              </span>

              <span className="text-4xl font-bold">
                R$ 0,00
              </span>
            </div>

            <button className="h-16 px-10 rounded-2xl bg-black text-white text-2xl font-semibold hover:opacity-90 active:scale-[0.98] transition">
              Continuar Pedido
            </button>
          </footer>
        </main>
      </body>
    </html>
  );
}