"use client";

import { use, useState } from "react";
import { useTotem } from "@totem/hooks/useTotem";
import WelcomeScreen from "../components/WelcomeScreen";
import OrderingScreen from "../components/OrderingScreen";
// Estes componentes devem existir na pasta ../components/
import IdentificationScreen from "../components/IdentificationScreen";
import FinishedScreen from "../components/FinishedScreen";
import "@/page.css";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

type TotemStep = 'WELCOME' | 'ORDERING' | 'IDENTIFICATION' | 'FINISHED';

export default function TotemPage({ params }: PageProps) {
  // No Next.js 15, params é uma Promise que deve ser resolvida com 'use'
  const { companyId } = use(params);
  const [step, setStep] = useState<TotemStep>('WELCOME');
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressComplement, setAddressComplement] = useState("");

  const { 
    products, 
    categories, 
    condiments,
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

  const handleFinish = async () => {
    await finishOrder({
      address: {
        street: addressStreet,
        number: addressNumber,
        neighborhood: addressNeighborhood,
        complement: addressComplement
      }
    });
    setStep('FINISHED');
    setAddressStreet("");
    setAddressNumber("");
    setAddressNeighborhood("");
    setAddressComplement("");
    setTimeout(() => {
      setStep('WELCOME');
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
    case 'WELCOME':
      return <WelcomeScreen onStart={() => setStep('ORDERING')} onLogout={logout} />;
    
    case 'ORDERING':
      return (
        <OrderingScreen 
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
          onCancel={() => setStep('WELCOME')}
        />
      );

    case 'IDENTIFICATION':
      return (
        <IdentificationScreen 
          addressStreet={addressStreet}
          setAddressStreet={setAddressStreet}
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

    case 'FINISHED':
      return <FinishedScreen />;

    default:
      return <WelcomeScreen onStart={() => setStep('ORDERING')} onLogout={logout} />;
  }
}
