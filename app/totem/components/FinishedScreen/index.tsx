"use client";
import { Check } from "lucide-react";

export default function FinishedScreen() {
  return (
    <div className="min-h-screen w-screen bg-brand-light flex items-center justify-center p-4 text-brand-dark select-none">
      
      <div className="bg-brand-surface w-full max-w-sm rounded-[24px] border border-brand-border p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)] flex flex-col items-center text-center">
        
        <div className="h-20 w-20 rounded-[20px] bg-brand-light flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-brand-success" strokeWidth={3} />
        </div>

        <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Pedido Enviado!</h1>
        <p className="text-sm text-brand-muted mt-2 mb-8">Obrigado pela preferência. Acompanhe seu pedido.</p>

        <div className="bg-brand-light px-4 py-2 rounded-[12px] text-xs font-bold text-brand-muted">
          Retornando à tela inicial...
        </div>
      </div>
    </div>
  );
}
