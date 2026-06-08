import {
  collection, query, where, onSnapshot, doc, addDoc, updateDoc,
  deleteDoc, Timestamp, getDocs, orderBy, limit, increment
} from "firebase/firestore";
import { firestore } from "./firebase";
import { PromotionEvent, Promotion } from "@totem/shared/types";
import { logger } from "@/src/lib/logger";

const EVENTS_COLLECTION = "promotionEvents";
const PROMOTIONS_COLLECTION = "promotions";

// ─── Promotion Events ─────────────────────────────────────────────────────

export function subscribeEvents(
  callback: (events: PromotionEvent[]) => void,
  onError?: (err: unknown) => void
) {
  const q = query(
    collection(firestore, EVENTS_COLLECTION),
    orderBy("displayOrder", "asc")
  );

  return onSnapshot(q, (snap) => {
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PromotionEvent));
    callback(events);
  }, (err) => {
    logger.error("promotions.service", "Erro ao escutar eventos", err);
    onError?.(err);
  });
}

export async function createEvent(data: Omit<PromotionEvent, "id" | "createdAt" | "updatedAt">) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(firestore, EVENTS_COLLECTION), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  logger.info("promotions.service", `Evento criado: ${docRef.id}`);
  return docRef.id;
}

export async function updateEvent(id: string, data: Partial<PromotionEvent>) {
  await updateDoc(doc(firestore, EVENTS_COLLECTION, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
  logger.info("promotions.service", `Evento ${id} atualizado`);
}

export async function deleteEvent(id: string) {
  await deleteDoc(doc(firestore, EVENTS_COLLECTION, id));
  logger.info("promotions.service", `Evento ${id} excluído`);
}

export async function getEventBySlug(slug: string): Promise<PromotionEvent | null> {
  const q = query(
    collection(firestore, EVENTS_COLLECTION),
    where("slug", "==", slug),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as PromotionEvent;
}

export async function ensurePermanentEvent() {
  const existing = await getEventBySlug("promocoes");
  if (existing) return existing;

  const now = Timestamp.now();
  const farFuture = new Date("2099-12-31T23:59:59");
  const docRef = await addDoc(collection(firestore, EVENTS_COLLECTION), {
    name: "Bora de promoção",
    slug: "promocoes",
    description: "",
    bannerUrl: "",
    status: "active",
    startAt: now,
    endAt: Timestamp.fromDate(farFuture),
    displayOrder: 9999,
    permanent: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
  });
  logger.info("promotions.service", `Evento permanente criado: ${docRef.id}`);
  return { id: docRef.id, name: "Promoções", slug: "promocoes", permanent: true } as PromotionEvent;
}

// ─── Promotions ────────────────────────────────────────────────────────────

export function subscribePromotionsByStore(
  storeId: string,
  callback: (promotions: Promotion[]) => void,
  onError?: (err: unknown) => void
) {
  const q = query(
    collection(firestore, PROMOTIONS_COLLECTION),
    where("storeId", "==", storeId)
  );

  return onSnapshot(q, (snap) => {
    const promotions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion));
    callback(promotions);
  }, (err) => {
    logger.error("promotions.service", "Erro ao escutar promoções", err);
    onError?.(err);
  });
}

export function subscribeActivePromotionsByStore(
  storeId: string,
  callback: (promotions: Promotion[]) => void,
  onError?: (err: unknown) => void
) {
  const now = new Date();
  const q = query(
    collection(firestore, PROMOTIONS_COLLECTION),
    where("storeId", "==", storeId),
    where("status", "==", "active")
  );

  return onSnapshot(q, (snap) => {
    const promotions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion));
    callback(promotions);
  }, (err) => {
    logger.error("promotions.service", "Erro ao escutar promoções ativas", err);
    onError?.(err);
  });
}

export function subscribePromotionsByEvent(
  eventId: string,
  callback: (promotions: Promotion[]) => void,
  onError?: (err: unknown) => void
) {
  const q = query(
    collection(firestore, PROMOTIONS_COLLECTION),
    where("eventId", "==", eventId),
    where("status", "==", "active")
  );

  return onSnapshot(q, (snap) => {
    const promotions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion));
    callback(promotions);
  }, (err) => {
    logger.error("promotions.service", "Erro ao escutar promoções do evento", err);
    onError?.(err);
  });
}

export async function checkProductHasActivePromotion(
  productId: string,
  storeId: string,
  excludePromotionId?: string
): Promise<boolean> {
  const q = query(
    collection(firestore, PROMOTIONS_COLLECTION),
    where("productId", "==", productId),
    where("storeId", "==", storeId),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;
  if (excludePromotionId && snap.docs.length === 1 && snap.docs[0].id === excludePromotionId) return false;
  return true;
}

export async function createPromotion(data: Omit<Promotion, "id" | "createdAt" | "updatedAt">) {
  const hasActive = await checkProductHasActivePromotion(data.productId, data.storeId);
  if (hasActive) {
    throw new Error("PRODUCT_ALREADY_IN_PROMOTION");
  }

  let eventId = data.eventId;

  if (!eventId) {
    const permanentEvent = await getEventBySlug("promocoes");
    if (permanentEvent) {
      eventId = permanentEvent.id;
    } else {
      const created = await ensurePermanentEvent();
      eventId = created.id;
    }
  }

  const now = Timestamp.now();
  const docRef = await addDoc(collection(firestore, PROMOTIONS_COLLECTION), {
    ...data,
    eventId,
    soldUnits: 0,
    createdAt: now,
    updatedAt: now,
  });
  logger.info("promotions.service", `Promoção criada: ${docRef.id}`);
  return docRef.id;
}

export async function updatePromotion(id: string, data: Partial<Promotion>) {
  await updateDoc(doc(firestore, PROMOTIONS_COLLECTION, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
  logger.info("promotions.service", `Promoção ${id} atualizada`);
}

export async function deletePromotion(id: string) {
  await deleteDoc(doc(firestore, PROMOTIONS_COLLECTION, id));
  logger.info("promotions.service", `Promoção ${id} excluída`);
}

export async function incrementSoldUnits(id: string, quantity: number) {
  const ref = doc(firestore, PROMOTIONS_COLLECTION, id);
  await updateDoc(ref, {
    soldUnits: increment(quantity),
    updatedAt: Timestamp.now(),
  });
}

// ─── Automations ───────────────────────────────────────────────────────────

export async function processAutomations() {
  const now = Timestamp.now();
  const nowDate = now.toDate();
  const results = { activatedEvents: 0, finishedEvents: 0, activatedPromotions: 0, finishedPromotions: 0 };

  // Activate scheduled events (startAt <= now)
  const scheduledEvents = await getDocs(query(
    collection(firestore, EVENTS_COLLECTION),
    where("status", "==", "scheduled")
  ));
  for (const docSnap of scheduledEvents.docs) {
    const data = docSnap.data();
    const startAt = data.startAt?.toDate();
    if (startAt && startAt <= nowDate) {
      await updateDoc(doc(firestore, EVENTS_COLLECTION, docSnap.id), {
        status: "active",
        updatedAt: now,
      });
      results.activatedEvents++;
    }
  }

  // Finish past events (non-permanent, endAt < now)
  const activeEvents = await getDocs(query(
    collection(firestore, EVENTS_COLLECTION),
    where("status", "==", "active")
  ));
  for (const docSnap of activeEvents.docs) {
    const data = docSnap.data();
    if (data.permanent === true) continue;
    const endAt = data.endAt?.toDate();
    if (endAt && endAt < nowDate) {
      await updateDoc(doc(firestore, EVENTS_COLLECTION, docSnap.id), {
        status: "finished",
        updatedAt: now,
      });
      results.finishedEvents++;
    }
  }

  // Activate scheduled promotions (startAt <= now)
  const scheduledPromos = await getDocs(query(
    collection(firestore, PROMOTIONS_COLLECTION),
    where("status", "==", "scheduled")
  ));
  for (const docSnap of scheduledPromos.docs) {
    const data = docSnap.data();
    const startAt = data.startAt?.toDate();
    if (startAt && startAt <= nowDate) {
      await updateDoc(doc(firestore, PROMOTIONS_COLLECTION, docSnap.id), {
        status: "active",
        updatedAt: now,
      });
      results.activatedPromotions++;
    }
  }

  // Finish past promotions (endAt < now) + sold out
  const activePromos = await getDocs(query(
    collection(firestore, PROMOTIONS_COLLECTION),
    where("status", "==", "active")
  ));
  for (const docSnap of activePromos.docs) {
    const data = docSnap.data();
    let shouldFinish = false;

    const endAt = data.endAt?.toDate();
    if (endAt && endAt < nowDate) shouldFinish = true;

    if (data.stockLimit != null && data.soldUnits >= data.stockLimit) shouldFinish = true;

    if (shouldFinish) {
      await updateDoc(doc(firestore, PROMOTIONS_COLLECTION, docSnap.id), {
        status: "finished",
        updatedAt: now,
      });
      results.finishedPromotions++;
    }
  }

  logger.info("promotions.service", "Automações processadas", results);
  return results;
}
