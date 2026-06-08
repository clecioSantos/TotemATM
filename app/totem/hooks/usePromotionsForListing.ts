"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { Promotion, PromotionEvent } from "@totem/shared/types";
import { subscribeEvents } from "@/src/services/promotions.service";
import { logger } from "@/src/lib/logger";

export function usePromotionsForListing() {
  const [events, setEvents] = useState<PromotionEvent[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubEvents = subscribeEvents(
      (all) => {
        const sorted = [...all]
          .filter((e) => e.status === "active")
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

        const promocoes = sorted.findIndex((e) => e.slug === "promocoes");
        if (promocoes >= 0) {
          const item = sorted.splice(promocoes, 1)[0];
          sorted.push(item);
        }

        setEvents(sorted);
      },
      (err) => {
        logger.error("usePromotionsForListing", "Erro ao carregar eventos", err);
      }
    );

    const unsubPromos = onSnapshot(
      query(collection(firestore, "promotions"), where("status", "==", "active")),
      (snap) => {
        try {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion));
          setPromotions(items);
          setLoading(false);
        } catch (err) {
          logger.error("usePromotionsForListing", "Erro ao processar promoções", err);
          setLoading(false);
        }
      },
      (err) => {
        logger.error("usePromotionsForListing", "Erro no listener de promoções", err);
        setLoading(false);
      }
    );

    return () => {
      unsubEvents();
      unsubPromos();
    };
  }, []);

  function getStoresForEvent(eventId: string): string[] {
    return [...new Set(
      promotions
        .filter((p) => p.eventId === eventId)
        .map((p) => p.storeId)
    )];
  }

  return { events, promotions, getStoresForEvent, loading };
}
