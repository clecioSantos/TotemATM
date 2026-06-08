"use client";

import { useState, useEffect, useCallback } from "react";
import { PromotionEvent } from "@totem/shared/types";
import {
  subscribeEvents,
  createEvent as serviceCreate,
  updateEvent as serviceUpdate,
  deleteEvent as serviceDelete,
} from "@/src/services/promotions.service";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { logger } from "@/src/lib/logger";

export function useEvents() {
  const [events, setEvents] = useState<PromotionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const unsub = subscribeEvents(
      (data) => {
        setEvents(data);
        setLoading(false);
      },
      (err) => {
        logger.error("useEvents", "Erro ao carregar eventos", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const createEvent = useCallback(async (data: any) => {
    if (!user?.uid) throw new Error("Usuário não autenticado");
    return serviceCreate({ ...data, createdBy: user.uid });
  }, [user?.uid]);

  const updateEvent = useCallback(async (id: string, data: any) => {
    return serviceUpdate(id, data);
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    return serviceDelete(id);
  }, []);

  return { events, loading, createEvent, updateEvent, deleteEvent };
}
