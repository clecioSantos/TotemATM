"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTotem } from "@totem/hooks/useTotem"; 
import OrderingScreen from "../components/OrderingScreen";
// Estes componentes devem existir na pasta ../components/
import IdentificationScreen from "../components/IdentificationScreen";
import FinishedScreen from "../components/FinishedScreen";
import PaymentScreen from "../components/PaymentScreen";
import "@/page.css";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

type TotemStep = 'WELCOME' | 'ORDERING' | 'IDENTIFICATION' | 'PAYMENT' | 'FINISHED';

export default function TotemPage({ params }: PageProps) {
  const router = useRouter();
  // No Next.js 15, params é uma Promise que deve ser resolvida com 'use'
  const { companyId } = use(params);

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
  
  // Estados de Pagamento
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [pixData, setPixData] = useState({ qrCode: "", copyPaste: "" });
  const [orderTotal, setOrderTotal] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { 
    products, 
    categories, 
    condiments, 
    companyName,
    companyBanner,
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    updateItemObservation,
    clearCart,
    finishOrder, 
    loading, 
    logout
  } = useTotem(companyId);

  // Cálculo manual do total do carrinho (Preço Base + Condimentos) * Quantidade
  const cartTotal = cart.reduce((acc, item) => {
    const condimentsPrice = item.condiments?.reduce((sum, cond) => sum + cond.price, 0) || 0;
    return acc + (item.price + condimentsPrice) * item.quantity;
  }, 0);

  const handleFinish = async (deliveryFee: number) => {
    setIsProcessingPayment(true);
    const total = cartTotal + deliveryFee;
    setOrderTotal(total);

    const orderData: any = {
      address: {
        street: addressStreet,
        number: addressNumber,
        neighborhood: addressNeighborhood,
        complement: addressComplement
      },
      deliveryFee,
      paymentMethod: 'PIX',
      paymentStatus: 'WAITING_PAYMENT'
    };

    // 1. Salva o pedido e aguarda o retorno do ID real do Firebase
    // Fazemos o cast para string para resolver o erro de 'void' enquanto o hook é atualizado
    const orderId = await finishOrder(orderData) as unknown as string;

    if (!orderId) {
      console.error("Erro: O ID do pedido não foi retornado pelo finishOrder.");
      setIsProcessingPayment(false);
      return;
    }

    // 2. Chamar nossa API para gerar o PIX no PagBank
    const res = await fetch("/api/payments/pix", {
      method: "POST",
      body: JSON.stringify({ 
        orderId, 
        amount: total, 
        customerName: "Cliente Totem" 
      })
    });
    const data = await res.json();

    setPixData({ qrCode: data.pixQrCode, copyPaste: data.pixCopyPaste });
    setCurrentOrderId(orderId);
    setStep('PAYMENT');
    setIsProcessingPayment(false);
  };

  const handlePaymentConfirmed = () => {
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
    };


  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">Carregando cardápio...</div>
      </div>
    );
  }

  switch (step) {
// import WelcomeScreen from "../components/WelcomeScreen";
// ...
    case 'ORDERING':
      return (
          <OrderingScreen 
            companyId={companyId}
            companyName={companyName}
            companyBanner={companyBanner}
            products={products}
            categories={categories}
            condiments={condiments}
            cart={cart}
            actions={{ 
              addToCart, 
              removeFromCart, 
              updateQuantity, 
              updateItemObservation, 
              clearCart 
            }}
            onFinish={() => setStep('IDENTIFICATION')}
            onCancel={() => router.push('/')}
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
            products={products}
            categories={categories}
            condiments={condiments}
            cart={cart}
            actions={{ 
              addToCart, 
              removeFromCart, 
              updateQuantity, 
              updateItemObservation, 
              clearCart 
            }}
            onFinish={() => setStep('IDENTIFICATION')}
            onCancel={() => router.push('/')}
          />
      );
  }
}
