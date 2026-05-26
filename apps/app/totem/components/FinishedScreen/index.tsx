"use client";
import { Check } from "lucide-react";

export default function FinishedScreen() {
  return (
    <div className="h-screen w-screen bg-brand-light flex items-center justify-center p-4 md:p-6 text-brand-dark select-none">
      
      {/* Central Card */}
      <div className="bg-white w-full max-w-md rounded-premium border border-brand-border/60 p-8 shadow-xl shadow-stone-200/50 flex flex-col items-center text-center">
        
        {/* Animated Check Circle */}
        <div className="h-20 w-20 rounded-full bg-brand-success/15 border-2 border-brand-success flex items-center justify-center shadow-lg shadow-green-500/10">
          <Check className="h-10 w-10 text-brand-success stroke-[3]" />
        </div>

        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-black text-brand-dark tracking-tight mt-6">
          Pedido Enviado!
        </h1>
        
        {/* Subtitle */}
        <p className="text-xs md:text-sm text-brand-muted mt-2 mb-8 max-w-[280px]">
          Agora é só relaxar. Acompanhe o andamento pelo painel da cozinha.
        </p>

        {/* Redirecting Notice */}
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-full text-[10px] md:text-xs font-semibold text-brand-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-ping"></span>
          <span>Retornando à tela inicial em instantes...</span>
        </div>
      </div>
    </div>
  );
}