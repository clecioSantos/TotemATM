"use client";

import { useState, useEffect } from "react";
import { PromotionEvent } from "@totem/shared/types";
import { subscribeEvents } from "@/src/services/promotions.service";
import { logger } from "@/src/lib/logger";

export function usePromotionEvents() {
  const [events, setEvents] = useState<PromotionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeEvents(
      (data) => {
        setEvents(data);
        setLoading(false);
      },
      (err) => {
        logger.error("usePromotionEvents", "Erro ao carregar eventos", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { events, loading };
}
