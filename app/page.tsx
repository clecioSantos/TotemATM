"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@totem/shared/types/AuthProvider";
import {
  TrendingUp, ShoppingCart, DollarSign, Package, MessageCircle, BarChart3,
  Clock, Shield, Smartphone, Zap, Layers, Star,
  ChevronRight, ArrowRight, Menu, X
} from "lucide-react";

const benefits = [
  { icon: ShoppingCart, title: "Gestão de pedidos", desc: "Acompanhe todos os pedidos em tempo real, do recebimento à entrega." },
  { icon: DollarSign, title: "Controle financeiro", desc: "Relatórios detalhados de faturamento, taxas e lucro por período." },
  { icon: Package, title: "Gestão de produtos", desc: "Cardápio digital com fotos, categorias, preços e promoções." },
  { icon: TrendingUp, title: "Totem de autoatendimento", desc: "Seu cliente pede sem precisar de atendente. Mais agilidade e vendas." },
  { icon: MessageCircle, title: "Integração WhatsApp", desc: "Receba notificações e confirmações automáticas no WhatsApp." },
  { icon: BarChart3, title: "Relatórios em tempo real", desc: "Métricas de vendas, ticket médio e produtos mais vendidos." },
];

const howItWorks = [
  { step: "01", title: "Receba pedidos", desc: "Seus clientes fazem pedidos pelo totem ou diretamente do celular." },
  { step: "02", title: "Gerencie operações", desc: "A cozinha recebe em tempo real. Controle o preparo e a entrega." },
  { step: "03", title: "Acompanhe resultados", desc: "Relatórios em tempo real mostram o desempenho do seu negócio." },
  { step: "04", title: "Aumente vendas", desc: "Com autoatendimento e agilidade, seu faturamento cresce naturalmente." },
];

const differentials = [
  { icon: Clock, title: "Tempo real", desc: "Todas as atualizações são instantâneas, sem atrasos." },
  { icon: Layers, title: "Multiempresa", desc: "Gerencie múltiplas unidades em um só painel." },
  { icon: Shield, title: "Segurança", desc: "Dados protegidos com criptografia e Firebase." },
  { icon: Zap, title: "Performance", desc: "Carregamento rápido mesmo em conexões lentas." },
  { icon: Smartphone, title: "Mobile First", desc: "Projetado para celular, funciona em qualquer dispositivo." },
  { icon: Star, title: "Suporte premium", desc: "Equipe dedicada para ajudar no que precisar." },
];

const testimonials = [
  { name: "Carlos Silva", role: "Proprietário", text: "O sistema transformou meu delivery. Reduzi o tempo de atendimento em 60% e as vendas aumentaram 40%." },
  { name: "Ana Oliveira", role: "Gerente", text: "O totem de autoatendimento foi um divisor de águas. Os clientes adoram a facilidade de pedir sozinhos." },
  { name: "Ricardo Santos", role: "Empreendedor", text: "Relatórios em tempo real me ajudam a tomar decisões rápidas. Indico para qualquer restaurante." },
];

function LandingContent() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const role = (user as any)?.role;
    if (role === "admin" || role === "owner") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/totem";
    }
  }, [user]);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-12px) } }
        .animate-fade-up { animation: fadeUp 0.6s ease-out both }
        .animate-fade-in { animation: fadeIn 0.8s ease-out both }
        .animate-float { animation: float 4s ease-in-out infinite }
        .delay-1 { animation-delay:0.1s }
        .delay-2 { animation-delay:0.2s }
        .delay-3 { animation-delay:0.3s }
        .delay-4 { animation-delay:0.4s }
        .delay-5 { animation-delay:0.5s }

        @media (min-width: 1280px) {
          .landing-scaler {
            transform: scale(3);
            transform-origin: top center;
            width: calc(100% / 3);
            margin: 0 auto;
          }
          .landing-outer {
            height: 100vh;
            overflow-y: auto;
            width: 100vw;
            position: relative;
          }
          .landing-outer::-webkit-scrollbar { width: 6px; }
          .landing-outer::-webkit-scrollbar-track { background: transparent; }
          .landing-outer::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        }
        @media (min-width: 1280px) {
          .landing-scaler .fixed-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
          }
        }
      `}</style>

      {/* Header */}
      <header className={`fixed-header fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/Logo.png" alt="Bora De Delivery" className="h-9 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#benefits" className="text-sm font-medium text-[#666] hover:text-[#1F1F1F] transition-colors">Recursos</a>
            <a href="#how-it-works" className="text-sm font-medium text-[#666] hover:text-[#1F1F1F] transition-colors">Como funciona</a>
            <a href="#differentials" className="text-sm font-medium text-[#666] hover:text-[#1F1F1F] transition-colors">Diferenciais</a>
            <a href="#testimonials" className="text-sm font-medium text-[#666] hover:text-[#1F1F1F] transition-colors">Depoimentos</a>
            <Link href="/login" className="h-10 px-5 bg-[#FF6B00] text-white text-sm font-bold rounded-xl hover:bg-[#E65C00] transition-all flex items-center">Entrar</Link>
          </nav>
          <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#EAEAEA] px-4 py-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm font-medium text-[#666]">Recursos</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm font-medium text-[#666]">Como funciona</a>
              <a href="#differentials" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm font-medium text-[#666]">Diferenciais</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm font-medium text-[#666]">Depoimentos</a>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="h-12 bg-[#FF6B00] text-white text-sm font-bold rounded-xl flex items-center justify-center">Entrar</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 h-8 px-4 bg-orange-50 border border-orange-200 rounded-full text-xs font-bold text-[#FF6B00] mb-6 animate-fade-up">
              Plataforma completa para delivery
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-6 animate-fade-up delay-1 tracking-[-0.02em]">
              Transforme seu delivery com uma{" "}
              <span className="text-[#FF6B00]">plataforma moderna</span>
              <br />rápida e integrada.
            </h1>
            <p className="text-lg md:text-xl text-[#666] leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-up delay-2">
              Receba pedidos, gerencie operações e acompanhe resultados em tempo real.
              Tudo que seu restaurante precisa em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-3">
              <Link href="/login" className="h-12 px-8 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] transition-all text-sm flex items-center gap-2 shadow-lg shadow-orange-200">
                Entrar agora <ArrowRight size={18} />
              </Link>
              <a href="#benefits" className="h-12 px-8 bg-white text-[#1F1F1F] font-bold rounded-xl hover:bg-gray-50 transition-all text-sm border border-[#EAEAEA] flex items-center gap-2">
                Conhecer plataforma <ChevronRight size={18} />
              </a>
            </div>
          </div>
          <div className="mt-16 max-w-4xl mx-auto animate-fade-up delay-4">
            <div className="bg-white rounded-2xl shadow-xl border border-[#EAEAEA] overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-[#FF6B00]/5 to-orange-50 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FF6B00] flex items-center justify-center animate-float">
                    <Smartphone size={32} className="text-white" />
                  </div>
                  <p className="text-[#666] text-sm">Interface moderna e responsiva</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Tudo que você precisa</h2>
            <p className="text-lg text-[#666] max-w-xl mx-auto">Funcionalidades completas para gerenciar seu delivery com eficiência.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                  <b.icon size={22} className="text-[#FF6B00]" />
                </div>
                <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Como funciona</h2>
            <p className="text-lg text-[#666] max-w-xl mx-auto">Em apenas 4 passos seu delivery está no ar.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((h, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center mx-auto mb-4 text-lg font-black">{h.step}</div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-[2px] bg-orange-200">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FF6B00]" />
                  </div>
                )}
                <h3 className="text-lg font-bold mb-2">{h.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section id="differentials" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Por que escolher o Bora de Delivery?</h2>
            <p className="text-lg text-[#666] max-w-xl mx-auto">Diferenciais que fazem a diferença no seu dia a dia.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {differentials.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                  <d.icon size={22} className="text-[#FF6B00]" />
                </div>
                <h3 className="text-lg font-bold mb-2">{d.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Quem usa recomenda</h2>
            <p className="text-lg text-[#666] max-w-xl mx-auto">Veja o que nossos clientes estão falando.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#FAFAFA] rounded-2xl p-6 border border-[#EAEAEA]">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} className="text-[#FFB800] fill-[#FFB800]" />)}
                </div>
                <p className="text-sm text-[#666] leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-sm font-bold">{t.name.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-[#666]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-[#FF6B00] to-[#E65C00] rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Pronto para modernizar seu delivery?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-lg mx-auto">Comece agora e transforme a forma como seu restaurante recebe pedidos.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="h-12 px-8 bg-white text-[#FF6B00] font-bold rounded-xl hover:bg-gray-100 transition-all text-sm flex items-center gap-2">
                Entrar agora <ArrowRight size={18} />
              </Link>
              <a href="#" className="h-12 px-8 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-sm border border-white/30 flex items-center gap-2">
                Solicitar demonstração
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#EAEAEA] bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/Logo.png" alt="Bora De Delivery" className="h-8 w-auto" />
              <span className="text-xs text-[#666]">© 2026 Bora De Delivery. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#666]">
              <span>v1.0.0</span>
              <span>Termos de uso</span>
              <span>Privacidade</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function LandingPage() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isDesktop) {
    return (
      <div className="landing-outer bg-[#FAFAFA] font-['Inter',sans-serif] text-[#1F1F1F]">
        <div className="landing-scaler">
          <LandingContent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Inter',sans-serif] text-[#1F1F1F]">
      <LandingContent />
    </div>
  );
}
