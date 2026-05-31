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
    <div className="payment-container">
      <div className="payment-card">
        <header className="payment-header">
          <h2 className="payment-title">Pagamento via PIX</h2>
          <p className="payment-subtitle">Aponte a câmera do seu celular para o código</p>
        </header>

        <div className="qr-code-section">
          <div className="qr-code-wrapper">
            <img src={pixData.qrCode} alt="QR Code PIX" className="qr-code-image" />
          </div>
          <div className="payment-amount">
            <span className="amount-label">Total a pagar</span>
            <span className="amount-value">R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>

        <div className="actions-section">
          <button className="copy-button" onClick={copyToClipboard}>
            {isCopied ? <CheckCircle size={20} /> : <Copy size={20} />}
            {isCopied ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
          </button>
        </div>

        <footer className="payment-footer">
          <div className="waiting-status">
            <Loader2 className="spinner" size={18} />
            <span>Aguardando confirmação...</span>
          </div>
          <p className="expiration-text">
            <Clock size={12} /> O código expira em 30 minutos
          </p>
        </footer>
      </div>
    </div>
  );
}
