"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

export interface SetupStatus {
  percent: number;
  completed: string[];
  pending: string[];
  canOpen: boolean;
  steps: {
    logo: boolean;
    banner: boolean;
    storeData: boolean;
    schedule: boolean;
    areas: boolean;
    deliveryOrPickup: boolean;
    mercadopago: boolean;
    category: boolean;
    product: boolean;
  };
}

const REQUIRED_STORE_FIELDS = ["name", "telefone", "endereco", "cidade", "bairro", "numero"];

export function useStoreSetupStatus(companyId: string | undefined) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const companySnap = await getDoc(doc(firestore, "companies", companyId));
        const data = companySnap.data();

        if (!data) {
          setStatus(null);
          setLoading(false);
          return;
        }

        const logo = !!data.logo;
        const banner = !!data.banner;
        const storeData = REQUIRED_STORE_FIELDS.every((f) => !!data[f]);

        const horario = data.horario;
        const schedule = !!horario && Object.values(horario).some(
          (d: any) => d?.open && d?.close
        );

        const areas = Array.isArray(data.areasAtuacao) && data.areasAtuacao.length > 0;

        const pickupEnabled = data.pickupEnabled === true;
        const deliveryCostsSnap = await getDocs(
          query(
            collection(firestore, "deliveryCosts"),
            where("companyId", "==", companyId)
          )
        );
        const hasDeliveryNeighborhood = deliveryCostsSnap.docs.some((d) => d.data().enabled === true);
        const deliveryOrPickup = pickupEnabled || hasDeliveryNeighborhood;

        const mercadopago = data.mercadopago_connected === true && !!data.mercadopago_access_token;

        const catSnap = await getDocs(
          query(collection(firestore, "categories"), where("companyId", "==", companyId))
        );
        const category = !catSnap.empty;

        const prodSnap = await getDocs(
          query(collection(firestore, "products"), where("companyId", "==", companyId))
        );
        const product = !prodSnap.empty;

        const steps = { logo, banner, storeData, schedule, areas, deliveryOrPickup, mercadopago, category, product };
        const stepCount = Object.keys(steps).length;
        const completedCount = Object.values(steps).filter(Boolean).length;
        const percent = Math.round((completedCount / stepCount) * 100);

        const completedLabels: Record<string, string> = {
          logo: "Foto de perfil",
          banner: "Banner",
          storeData: "Dados da loja",
          schedule: "Horários de funcionamento",
          areas: "Áreas de atuação",
          deliveryOrPickup: "Entrega ou retirada",
          mercadopago: "Mercado Pago",
          category: "Categoria",
          product: "Produto",
        };

        const completed = Object.entries(steps)
          .filter(([, v]) => v)
          .map(([k]) => completedLabels[k]);

        const pending = Object.entries(steps)
          .filter(([, v]) => !v)
          .map(([k]) => completedLabels[k]);

        setStatus({
          percent,
          completed,
          pending,
          canOpen: Object.values(steps).every(Boolean),
          steps,
        });
      } catch (err) {
        console.error("Erro ao verificar status da loja:", err);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [companyId, refetchCounter]);

  return { status, loading, refetch: () => setRefetchCounter((c) => c + 1) };
}
