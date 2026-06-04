"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { QrCode, Copy, CheckCircle, Loader2, Clock, Smartphone } from "lucide-react";
import "./styles.css";

interface PaymentScreenProps {
  orderId: string;
  pixData: { qrCode: string; copyPaste: string };
  total: number;
  onPaymentConfirmed: () => void;
}

export default function PaymentScreen({ orderId, pixData, total, onPaymentConfirmed }: PaymentScreenProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    // Escuta em tempo real o documento do pedido no Firestore
    // O Webhook do PagBank atualizará o status para PAID
    const unsubscribe = onSnapshot(doc(firestore, "orders", orderId), (snapshot) => {
      const data = snapshot.data();
      if (data?.paymentStatus === "PAID") {
        onPaymentConfirmed();
      }
    });

    return () => unsubscribe();
  }, [orderId, onPaymentConfirmed]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixData.copyPaste);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="min-h-screen w-screen bg-brand-light flex items-center justify-center p-4">
      <div className="bg-brand-surface w-full max-w-md rounded-[24px] border border-brand-border p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)] text-center">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-brand-dark">Pagamento via PIX</h2>
          <p className="text-sm text-brand-muted mt-2">Aponte a câmera para o QR Code abaixo</p>
        </div>

        <div className="bg-brand-light p-4 rounded-[20px] mb-8 inline-block border border-brand-border">
          <img src={pixData.qrCode} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
        </div>

        <div className="mb-8">
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Total a pagar</span>
          <p className="text-3xl font-black text-brand-primary mt-1">R$ {total.toFixed(2).replace(".", ",")}</p>
        </div>

        <button 
          onClick={copyToClipboard}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-[12px] font-bold text-sm transition-all ${
            isCopied 
              ? 'bg-brand-muted text-white' 
              : 'bg-brand-primary text-white hover:bg-brand-primaryHover'
          }`}
        >
          {isCopied ? <CheckCircle size={20} /> : <Copy size={20} />}
          {isCopied ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-brand-muted text-xs font-bold">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Aguardando pagamento...</span>
        </div>
      </div>
    </div>
  );
}
