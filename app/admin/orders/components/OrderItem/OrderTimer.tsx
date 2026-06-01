"use client";

import { useEffect, useState } from "react";

interface OrderTimerProps {
  createdAt: any; // Timestamp do Firebase ou Date
}

export default function OrderTimer({ createdAt }: OrderTimerProps) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const start = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
      const diffInMs = now.getTime() - start.getTime();
      
      const diffInMins = Math.floor(diffInMs / 60000);
      
      if (diffInMins < 1) {
        setElapsed("Agora mesmo");
      } else if (diffInMins < 60) {
        setElapsed(`${diffInMins} min atrás`);
      } else {
        const hours = Math.floor(diffInMins / 60);
        setElapsed(`${hours}h atrás`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Atualiza a cada 1 minuto

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span className="order-elapsed-timer">{elapsed}</span>
  );
}