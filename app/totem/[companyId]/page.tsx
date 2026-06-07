"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useTotem } from "@totem/hooks/useTotem";
import OrderingScreen from "../components/OrderingScreen";
import IdentificationScreen from "../components/IdentificationScreen";
import FinishedScreen from "../components/FinishedScreen";
import PaymentScreen from "../components/PaymentScreen";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import "@/page.css";

interface PageProps {
  params: { companyId: string };
}

type TotemStep = 'WELCOME' | 'ORDERING' | 'IDENTIFICATION' | 'PAYMENT' | 'FINISHED';

export default function TotemPage({ params }: PageProps) {
  return (
    <ErrorBoundary context="TotemPage">
      <TotemContent params={params} />
    </ErrorBoundary>
  );
}

function TotemContent({ params }: PageProps) {
  const router = useRouter();
  const { companyId } = params;

  useEffect(() => {
    if (!companyId) {
      router.push('/');
    }
  }, [companyId, router]);

  const [step, setStep] = useState<TotemStep>('ORDERING');
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressComplement, setAddressComplement] = useState("");

  const [currentOrderId, setCurrentOrderId] = useState("");
  const [pixData, setPixData] = useState({ qrCode: "", copyPaste: "" });
  const [orderTotal, setOrderTotal] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    products,
    categories,
    condiments,
    flavors,
    companyName,
    companyBanner,
    companyOpen,
    averageRating,
    reviewCount,
    tempoPreparoMin,
    tempoPreparoMax,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemObservation,
    clearCart,
    finishOrder,
    loading,
    logout,
  } = useTotem(companyId);

  const cartTotal = cart.reduce((acc, item) => {
    const basePrice = item.tamanhoSelecionado ? item.tamanhoSelecionado.preco : item.price;
    const condimentsPrice = item.condiments?.reduce((sum, cond) => sum + cond.price, 0) || 0;
    const flavorsPrice = item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0;
    return acc + (basePrice + flavorsPrice + condimentsPrice) * item.quantity;
  }, 0);

  const handleFinish = async (deliveryFee: number) => {
    if (companyOpen === false) {
      alert("Loja fechada. Não é possível realizar pedidos no momento.");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const total = cartTotal + deliveryFee;
      setOrderTotal(total);

      const orderData: any = {
        address: {
          street: addressStreet,
          number: addressNumber,
          neighborhood: addressNeighborhood,
          complement: addressComplement,
        },
        deliveryFee,
        paymentMethod: 'PIX',
        paymentStatus: 'WAITING_PAYMENT',
      };

      const orderId = await finishOrder(orderData) as unknown as string;

      if (!orderId) {
        logger.error("TotemPage", "ID do pedido não foi retornado pelo finishOrder");
        setIsProcessingPayment(false);
        return;
      }

      const res = await fetch("/api/payments/pix", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          amount: total,
          customerName: "Cliente Totem",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        logger.error("TotemPage", "Erro na API de PIX", undefined, {
          status: res.status,
          errorData,
        });
        alert("Erro ao gerar pagamento. Tente novamente.");
        setIsProcessingPayment(false);
        return;
      }

      const data = await res.json();

      if (data.sandbox) {
        logger.info("TotemPage", `Sandbox ativo — pedido ${orderId} pago automaticamente`);
        handlePaymentConfirmed();
        return;
      }

      setPixData({ qrCode: data.qrCode || data.pixQrCode, copyPaste: data.pixCode || data.pixCopyPaste });

      try {
        await updateDoc(doc(firestore, "orders", orderId), {
          paymentProvider: data.provider || "pagbank",
          paymentExternalId: data.paymentId,
          paymentStatus: "WAITING_PAYMENT",
          paymentPayload: {
            provider: data.provider,
            paymentId: data.paymentId,
            status: data.status,
          },
        });
      } catch (updateError) {
        logger.error("TotemPage", "Erro ao salvar dados de pagamento no pedido", updateError);
      }

      setCurrentOrderId(orderId);
      setStep('PAYMENT');
    } catch (error) {
      logger.error("TotemPage", "Erro ao finalizar pedido", error);
      alert("Erro ao processar pedido. Tente novamente.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentConfirmed = () => {
    try {
      setStep('FINISHED');
      clearCart();
      setAddressStreet("");
      setAddressNumber("");
      setAddressCity("");
      setAddressNeighborhood("");
      setAddressComplement("");
      setTimeout(() => {
        setStep('ORDERING');
      }, 5000);
    } catch (error) {
      logger.error("TotemPage", "Erro ao confirmar pagamento", error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">Carregando cardápio...</div>
      </div>
    );
  }

  switch (step) {
    case 'ORDERING':
      return (
        <OrderingScreen
          companyId={companyId}
          companyName={companyName}
          companyBanner={companyBanner}
          companyOpen={companyOpen}
          averageRating={averageRating}
          reviewCount={reviewCount}
          tempoPreparoMin={tempoPreparoMin}
          tempoPreparoMax={tempoPreparoMax}
          products={products}
          categories={categories}
          condiments={condiments}
          flavors={flavors}
          cart={cart}
          actions={{
            addToCart,
            removeFromCart,
            updateQuantity,
            updateItemObservation,
            clearCart,
          }}
          onFinish={() => setStep('IDENTIFICATION')}
          onCancel={() => router.push('/totem')}
        />
      );

    case 'IDENTIFICATION':
      return (
        <IdentificationScreen
          addressStreet={addressStreet}
          setAddressStreet={setAddressStreet}
          addressCity={addressCity}
          setAddressCity={setAddressCity}
          addressNumber={addressNumber}
          setAddressNumber={setAddressNumber}
          addressNeighborhood={addressNeighborhood}
          setAddressNeighborhood={setAddressNeighborhood}
          addressComplement={addressComplement}
          setAddressComplement={setAddressComplement}
          onConfirm={handleFinish}
          onBack={() => setStep('ORDERING')}
        />
      );

    case 'PAYMENT':
      return (
        <PaymentScreen
          orderId={currentOrderId}
          pixData={pixData}
          total={orderTotal}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      );

    case 'FINISHED':
      return <FinishedScreen />;

    default:
      return (
        <OrderingScreen
          companyId={companyId}
          companyName={companyName}
          companyBanner={companyBanner}
          companyOpen={companyOpen}
          averageRating={averageRating}
          reviewCount={reviewCount}
          tempoPreparoMin={tempoPreparoMin}
          tempoPreparoMax={tempoPreparoMax}
          products={products}
          categories={categories}
          condiments={condiments}
          flavors={flavors}
          cart={cart}
          actions={{
            addToCart,
            removeFromCart,
            updateQuantity,
            updateItemObservation,
            clearCart,
          }}
          onFinish={() => setStep('IDENTIFICATION')}
          onCancel={() => router.push('/totem')}
        />
      );
    }
  }
