"use client";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface IdentificationScreenProps {
  addressStreet: string;
  setAddressStreet: (val: string) => void;
  addressNumber: string;
  setAddressNumber: (val: string) => void;
  addressNeighborhood: string;
  setAddressNeighborhood: (val: string) => void;
  addressComplement: string;
  setAddressComplement: (val: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export default function IdentificationScreen({
  addressStreet, setAddressStreet, addressNumber, setAddressNumber, addressNeighborhood, setAddressNeighborhood, addressComplement, setAddressComplement, onConfirm, onBack
}: IdentificationScreenProps) {
  return (
    <div className="min-h-screen w-screen bg-brand-light flex items-center justify-center p-4 md:p-6 text-brand-dark select-none">
      
      {/* Central Card */}
      <div className="bg-white w-full max-w-md rounded-premium border border-brand-border/60 p-6 md:p-8 shadow-xl shadow-stone-200/50 flex flex-col">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-black text-brand-dark tracking-tight flex items-center justify-center gap-1.5">
            Quase lá
            <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse"></span>
          </h1>
          <p className="text-xs md:text-sm text-brand-muted mt-2 mb-6">
            Informe o endereço para entregarmos seu pedido.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-4 mb-8">
          <span className="text-[10px] font-black tracking-widest text-brand-muted uppercase text-center">Endereço de Entrega</span>

          {/* Rua */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-2 ml-1">
              Rua / Logradouro
            </label>
            <input 
              type="text" 
              placeholder="Ex: Av. Paulista" 
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 focus:border-brand-accent px-5 py-4 rounded-xl text-base font-semibold text-brand-dark focus:outline-none transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Número */}
            <div className="flex flex-col col-span-1">
              <label className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-2 ml-1">
                Nº
              </label>
              <input 
                type="text" 
                placeholder="123" 
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-brand-accent px-4 py-4 rounded-xl text-base font-semibold text-brand-dark focus:outline-none transition-all duration-200"
              />
            </div>
            {/* Bairro */}
            <div className="flex flex-col col-span-2">
              <label className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-2 ml-1">
                Bairro
              </label>
              <input 
                type="text" 
                placeholder="Centro" 
                value={addressNeighborhood}
                onChange={(e) => setAddressNeighborhood(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-brand-accent px-4 py-4 rounded-xl text-base font-semibold text-brand-dark focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Complemento */}
          <input 
            type="text" 
            placeholder="Complemento (Apto, bloco...)" 
            value={addressComplement}
            onChange={(e) => setAddressComplement(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 px-5 py-4 rounded-xl text-base font-semibold text-brand-dark focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button 
            className="w-full bg-brand-success hover:bg-green-700 text-white font-black text-base py-4 rounded-premium shadow-lg shadow-green-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
            disabled={!addressStreet || !addressNumber || !addressNeighborhood} 
            onClick={onConfirm}
          >
            <span>CONFIRMAR E ENVIAR</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button 
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 py-3 rounded-full hover:bg-stone-50 transition-colors" 
            onClick={onBack}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar para o pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
}