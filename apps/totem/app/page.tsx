"use client";
import { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import OrderingScreen from "./components/OrderingScreen";
import IdentificationScreen from "./components/IdentificationScreen";
import FinishedScreen from "./components/FinishedScreen";
import { useTotem } from "./hooks/useTotem";
import "./page.css";

type TotemStep = 'WELCOME' | 'ORDERING' | 'IDENTIFICATION' | 'FINISHED';

export default function TotemPage() {
  const [step, setStep] = useState<TotemStep>('WELCOME');
  const { 
    products, categories, cart, addToCart, removeFromCart, 
    updateQuantity, finishOrder, clearCart, updateItemObservation, loading 
  } = useTotem();
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  const handleFinish = async () => {
    await finishOrder(customerName, tableNumber);
    setStep('FINISHED');
    setCustomerName("");
    setTableNumber("");
    setTimeout(() => {
      setStep('WELCOME');
    }, 5000);
  };

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div></div>;
  }

  switch (step) {
    case 'WELCOME':
      return <WelcomeScreen onStart={() => setStep('ORDERING')} />;
    
    case 'ORDERING':
      return (
        <OrderingScreen 
          products={products}
          categories={categories}
          cart={cart}
          actions={{ addToCart, removeFromCart, updateQuantity, updateItemObservation, clearCart }}
          onFinish={() => setStep('IDENTIFICATION')}
          onCancel={() => setStep('WELCOME')}
        />
      );

    case 'IDENTIFICATION':
      return (
        <IdentificationScreen 
          customerName={customerName}
          setCustomerName={setCustomerName}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          onConfirm={handleFinish}
          onBack={() => setStep('ORDERING')}
        />
      );

    case 'FINISHED':
      return <FinishedScreen />;

    default:
      return <WelcomeScreen onStart={() => setStep('ORDERING')} />;
  }
}
