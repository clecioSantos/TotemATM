"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { Copy, CheckCircle, Loader2, CreditCard, X } from "lucide-react";
import { logger } from "@/src/lib/logger";
import "./styles.css";

function getPaymentCompanyId(fallback: string): string {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem("totem-cart");
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    if (Array.isArray(data.items) && data.items.length > 0) return data.companyId || fallback;
  } catch {}
  return fallback;
}

interface PaymentScreenProps {
  orderId: string;
  total: number;
  companyId: string;
  onPaymentConfirmed: () => void;
  onCancel: () => void;
}

export default function PaymentScreen({ orderId, total, companyId: pageCompanyId, onPaymentConfirmed, onCancel }: PaymentScreenProps) {
  const companyId = getPaymentCompanyId(pageCompanyId);
  const [method, setMethod] = useState<"pix" | "credit_card" | null>(null);

  return (
    <div className="min-h-screen w-screen bg-brand-light flex items-center justify-center p-4">
      <div className="bg-brand-surface w-full max-w-md rounded-[24px] border border-brand-border p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-brand-dark">Finalizar Pedido</h2>
          <p className="text-3xl font-black text-brand-primary mt-2">R$ {total.toFixed(2).replace(".", ",")}</p>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2 text-center">Forma de pagamento</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMethod("pix")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                method === "pix"
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-brand-light text-brand-muted border border-brand-border"
              }`}
            >
              PIX
            </button>
            <button
              onClick={() => setMethod("credit_card")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                method === "credit_card"
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-brand-light text-brand-muted border border-brand-border"
              }`}
            >
              Cartão de Crédito
            </button>
          </div>
        </div>

        {method === "pix" && (
          <PixPaymentContent orderId={orderId} total={total} companyId={companyId} onPaymentConfirmed={onPaymentConfirmed} />
        )}

        {method === "credit_card" && (
          <CardPaymentForm orderId={orderId} total={total} companyId={companyId} onPaymentConfirmed={onPaymentConfirmed} />
        )}

        <button
          onClick={onCancel}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] font-bold text-sm mt-4 border border-red-200 text-red-500 hover:bg-red-50 transition-all"
        >
          <X size={18} />
          Cancelar pedido
        </button>
      </div>
    </div>
  );
}

function PixPaymentContent({ orderId, total, companyId, onPaymentConfirmed }: {
  orderId: string;
  total: number;
  companyId: string;
  onPaymentConfirmed: () => void;
}) {
  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const onConfirmedRef = useRef(onPaymentConfirmed);
  onConfirmedRef.current = onPaymentConfirmed;

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(
      doc(firestore, "orders", orderId),
      (snapshot) => {
        try {
          const data = snapshot.data();
          if (data?.paymentStatus === "PAID") {
            logger.info("PaymentScreen", `Pagamento PIX confirmado para pedido ${orderId}`);
            onConfirmedRef.current();
          }
        } catch (error) {
          logger.error("PaymentScreen", "Erro ao processar snapshot do pedido", error);
        }
      },
      (error: unknown) => {
        const errMsg = error instanceof Error ? error.message : String(error);
        logger.error("PaymentScreen", `Erro no listener do pedido ${orderId}: ${errMsg}`, error);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    const fetchPix = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/payments/pix", {
          method: "POST",
          body: JSON.stringify({
            orderId,
            amount: total,
            customerName: "Cliente Totem",
            companyId,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Erro ao gerar PIX");
        }

        const data = await res.json();

        if (data.sandbox) {
          logger.info("PaymentScreen", `Sandbox ativo — pedido ${orderId} pago automaticamente`);
          onConfirmedRef.current();
          return;
        }

        setPixData({ qrCode: data.qrCode || data.pixQrCode, copyPaste: data.pixCode || data.pixCopyPaste });

        await updateDoc(doc(firestore, "orders", orderId), {
          paymentProvider: data.provider || "mercadopago",
          paymentExternalId: data.paymentId,
          paymentMethod: "PIX",
          paymentPayload: {
            provider: data.provider,
            paymentId: data.paymentId,
            status: data.status,
          },
        });
      } catch (err: any) {
        setError(err.message || "Erro ao gerar pagamento");
      } finally {
        setLoading(false);
      }
    };

    fetchPix();
  }, [orderId, total, companyId]);

  const copyToClipboard = () => {
    if (!pixData) return;
    try {
      navigator.clipboard.writeText(pixData.copyPaste);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      logger.error("PaymentScreen", "Erro ao copiar PIX", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-brand-muted">
        <Loader2 className="animate-spin h-5 w-5" />
        <span className="text-sm font-bold">Gerando QR Code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold text-center">
        {error}
      </div>
    );
  }

  if (!pixData) return null;

  return (
    <div className="text-center">
      <div className="mb-4">
        <p className="text-sm text-brand-muted">Aponte a câmera para o QR Code abaixo</p>
      </div>

      <div className="bg-brand-light p-4 rounded-[20px] mb-4 inline-block border border-brand-border">
        <img src={pixData.qrCode} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
      </div>

      <button
        onClick={copyToClipboard}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-[12px] font-bold text-sm transition-all ${
          isCopied
            ? 'bg-brand-muted text-white'
            : 'bg-brand-primary text-white hover:bg-brand-primaryHover'
        }`}
      >
        {isCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
        {isCopied ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-brand-muted text-xs font-bold">
        <Loader2 className="animate-spin h-4 w-4" />
        <span>Aguardando pagamento...</span>
      </div>
    </div>
  );
}

interface MercadoPagoCardToken {
  id: string;
  payment_method_id: string;
  issuer_id: string;
  cardholder: Record<string, unknown>;
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string) => {
      createCardToken: (data: {
        cardNumber: string;
        cardholderName: string;
        cardExpirationMonth: string;
        cardExpirationYear: string;
        securityCode: string;
      }) => Promise<MercadoPagoCardToken>;
    };
  }
}

function CardPaymentForm({ orderId, total, companyId, onPaymentConfirmed }: {
  orderId: string;
  total: number;
  companyId: string;
  onPaymentConfirmed: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const onConfirmedRef = useRef(onPaymentConfirmed);
  onConfirmedRef.current = onPaymentConfirmed;

  useEffect(() => {
    if (document.getElementById("mercadopago-sdk")) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "mercadopago-sdk";
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => setError("Erro ao carregar processador de pagamento");
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById("mercadopago-sdk");
      if (existing) existing.remove();
    };
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(
      doc(firestore, "orders", orderId),
      (snapshot) => {
        try {
          const data = snapshot.data();
          if (data?.paymentStatus === "PAID") {
            logger.info("PaymentScreen", `Pagamento cartão confirmado para pedido ${orderId}`);
            onConfirmedRef.current();
          }
        } catch (error) {
          logger.error("PaymentScreen", "Erro ao processar snapshot do pedido", error);
        }
      },
      (error: unknown) => {
        const errMsg = error instanceof Error ? error.message : String(error);
        logger.error("PaymentScreen", `Erro no listener do pedido ${orderId}: ${errMsg}`, error);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSubmit = useCallback(async () => {
    setError("");

    if (!sdkLoaded) {
      setError("Processador de pagamento ainda não carregou");
      return;
    }

    if (!cardNumber.trim() || !cardholderName.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
      setError("Preencha todos os campos do cartão");
      return;
    }

    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 13) {
      setError("Número do cartão inválido");
      return;
    }

    const expiryDigits = cardExpiry.replace(/\D/g, "");
    if (expiryDigits.length !== 4) {
      setError("Data de validade inválida");
      return;
    }

    if (cardCvv.replace(/\D/g, "").length < 3) {
      setError("CVV inválido");
      return;
    }

    setProcessing(true);

    try {
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";
      logger.info("CARD_FORM", "Iniciando tokenização", {
        publicKeyPreview: publicKey.substring(0, 10) + "...",
        cardBrand: digits.startsWith("5") ? "mastercard" : digits.startsWith("4") ? "visa" : "unknown",
      });

      const mp = new window.MercadoPago(publicKey);

      const cardToken = await mp.createCardToken({
        cardNumber: digits,
        cardholderName: cardholderName.trim().toUpperCase(),
        cardExpirationMonth: expiryDigits.slice(0, 2),
        cardExpirationYear: `20${expiryDigits.slice(2)}`,
        securityCode: cardCvv.replace(/\D/g, ""),
      });

      const paymentMethodId = cardToken.payment_method_id;
      const issuerId = cardToken.issuer_id;

      logger.info("CARD_FORM", "Token gerado com sucesso", {
        tokenPreview: (cardToken.id || "").substring(0, 6) + "...",
        paymentMethodId,
        issuerId,
        installments: 1,
        amount: total,
        hasCompanyId: !!companyId,
      });

      const payload = {
        orderId,
        amount: total,
        token: cardToken.id,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId,
        installments: 1,
        customerName: "Cliente Totem",
        companyId,
      };

      const res = await fetch("/api/payments/mercadopago/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.status === "approved") {
        logger.info("MP_CARD_PAYMENT_APPROVED", "Pagamento por cartão aprovado no frontend", {
          orderId,
          paymentId: data.paymentId,
          paymentMethodId,
          issuerId,
        });
        onConfirmedRef.current();
      } else {
        const mpError = data.cause?.[0]?.description || data.statusDetail || data.error;
        setError(mpError || "Pagamento não aprovado");
        setProcessing(false);

        logger.warn("CARD_FORM", "Pagamento rejeitado", {
          orderId,
          paymentMethodId,
          issuerId,
          error: data.error,
          statusDetail: data.statusDetail,
          cause: data.cause,
          code: data.code,
        });
      }
    } catch (err: any) {
      const message = err?.message || "Erro ao processar pagamento";
      setError(message);
      setProcessing(false);

      logger.error("CARD_FORM", "Erro ao processar pagamento", err);
    }
  }, [sdkLoaded, cardNumber, cardholderName, cardExpiry, cardCvv, orderId, total, companyId]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold text-center">
          {error}
        </div>
      )}

      <div>
        <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">Número do cartão</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0000 0000 0000 0000"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-light text-sm font-medium outline-none focus:border-brand-primary transition-colors"
          maxLength={19}
        />
      </div>

      <div>
        <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">Nome impresso no cartão</label>
        <input
          type="text"
          placeholder="NOME DO TITULAR"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-light text-sm font-medium outline-none focus:border-brand-primary transition-colors"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">Validade</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-light text-sm font-medium outline-none focus:border-brand-primary transition-colors"
            maxLength={5}
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">CVV</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123"
            value={cardCvv}
            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-light text-sm font-medium outline-none focus:border-brand-primary transition-colors"
            maxLength={4}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={processing || !sdkLoaded}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-[12px] font-bold text-sm transition-all ${
          processing || !sdkLoaded
            ? 'bg-brand-muted text-white cursor-not-allowed'
            : 'bg-brand-primary text-white hover:bg-brand-primaryHover'
        }`}
      >
        {processing ? (
          <>
            <Loader2 className="animate-spin h-4 w-4" />
            <span>Processando...</span>
          </>
        ) : (
          <>
            <CreditCard size={18} />
            <span>PAGAR R$ {total.toFixed(2).replace(".", ",")}</span>
          </>
        )}
      </button>
    </div>
  );
}