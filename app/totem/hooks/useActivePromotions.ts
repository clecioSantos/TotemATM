"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { Promotion, PromotionEvent } from "@totem/shared/types";
import { subscribeEvents } from "@/src/services/promotions.service";
import { logger } from "@/src/lib/logger";

export function useActivePromotionsByStore(storeId: string) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "promotions"),
      where("storeId", "==", storeId),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(q, (snap) => {
      try {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion));
        setPromotions(items);
        setLoading(false);
      } catch (err) {
        logger.error("useActivePromotionsByStore", "Erro ao carregar promoções ativas", err);
        setLoading(false);
      }
    }, (err) => {
      logger.error("useActivePromotionsByStore", "Erro no listener", err);
      setLoading(false);
    });

    return () => unsub();
  }, [storeId]);

  return { promotions, loading };
}

export function useActiveEvents() {
  const [events, setEvents] = useState<PromotionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeEvents(
      (all) => {
        const active = all
          .filter((e) => e.status === "active" || (e.status === "scheduled" && e.startAt))
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setEvents(active);
        setLoading(false);
      },
      (err) => {
        logger.error("useActiveEvents", "Erro ao carregar eventos", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { events, loading };
}

export function useActivePromotionsByEvent(eventId: string) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "promotions"),
      where("eventId", "==", eventId),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(q, (snap) => {
      try {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion));
        setPromotions(items);
        setStoreIds([...new Set(items.map((p) => p.storeId))]);
        setLoading(false);
      } catch (err) {
        logger.error("useActivePromotionsByEvent", "Erro ao carregar", err);
        setLoading(false);
      }
    }, (err) => {
      logger.error("useActivePromotionsByEvent", "Erro no listener", err);
      setLoading(false);
    });

    return () => unsub();
  }, [eventId]);

  return { promotions, storeIds, loading };
}
