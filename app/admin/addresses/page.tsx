"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { useStorePermissions } from "@/src/hooks/useStorePermissions";
import { useConfirm } from "@/app/components/ConfirmProvider";
import { ShieldAlert } from "lucide-react";
import { collection, onSnapshot, query, where, deleteDoc, doc, addDoc, updateDoc, getDocs, writeBatch, FirestoreError } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

import CityTable from "./CityTable";
import NeighborhoodTable from "./NeighborhoodTable";
import Modal from "../components/Modal";
import CityForm from "./CityForm";
import NeighborhoodForm from "./NeighborhoodForm";
import PriceForm from "./PriceForm";

import "./page.css";

function AddressesManagementContent() {
  const { user } = useAuth();
  const { can: canManage } = useStorePermissions();
  const { showAlert } = useConfirm();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || canManage('manageAddresses');
  const isOwner = user?.role === 'owner' || canManage('manageAddresses');

  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [citySettings, setCitySettings] = useState<any[]>([]);
  const [deliveryCosts, setDeliveryCosts] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [pickupEnabled, setPickupEnabled] = useState(false);

  useEffect(() => {
    if (!user?.companyId) return;
    const unsub = onSnapshot(doc(firestore, "companies", user.companyId), (snap) => {
      if (snap.exists()) {
        setPickupEnabled(snap.data().pickupEnabled === true);
      }
    });
    return () => unsub();
  }, [user?.companyId]);
  
  const [modalConfig, setModalConfig] = useState<{ type: 'city' | 'nb' | 'price' | 'city_price' | null, data?: any }>({ type: null, data: null });

  // Carregar Cidades
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "cities"), (snapshot) => {
      try {
        setCities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
      } catch (error) {
        logger.error("ADDRESSES_PAGE", "Erro ao processar cidades", error);
      }
    }, (error) => {
      logger.error("ADDRESSES_PAGE", "Erro no listener de cidades", error);
    });
    return () => unsubscribe();
  }, []);

  // Carregar Bairros da Cidade Selecionada
  useEffect(() => {
    if (selectedCityId) {
      const unsubscribe = onSnapshot(
        query(collection(firestore, "neighborhoods"), where("cityId", "==", selectedCityId)),
        (snapshot) => {
          try {
            setNeighborhoods(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
          } catch (error) {
            logger.error("ADDRESSES_PAGE", "Erro ao processar bairros", error);
          }
        },
        (error) => {
          logger.error("ADDRESSES_PAGE", "Erro no listener de bairros", error);
        }
      );
      return () => unsubscribe();
    }
    setNeighborhoods([]);
  }, [selectedCityId]);

  // Carregar configurações de Cidade
  useEffect(() => {
    if (!user?.companyId) return;
    const q = query(collection(firestore, "storeCitySettings"), where("companyId", "==", user.companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        setCitySettings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        logger.error("ADDRESSES_PAGE", "Erro ao processar configurações de cidade", error);
      }
    }, (error) => {
      logger.error("ADDRESSES_PAGE", "Erro no listener de configurações de cidade", error);
    });
    return () => unsubscribe();
  }, [user?.companyId]);

  // Carregar Custos de Entrega (Bairros) por Empresa
  useEffect(() => {
    if (!user?.companyId) return;
    const q = query(collection(firestore, "deliveryCosts"), where("companyId", "==", user.companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        setDeliveryCosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        logger.error("ADDRESSES_PAGE", "Erro ao processar custos de entrega", error);
      }
    }, (error) => {
      logger.error("ADDRESSES_PAGE", "Erro no listener de custos de entrega", error);
    });
    return () => unsubscribe();
  }, [user?.companyId]);

  // configurações de Cidade
  const handleDeleteCity = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "cities", id));
      if (selectedCityId === id) setSelectedCityId("");
      logger.info("ADDRESSES_PAGE", `Cidade ${id} removida`);
    } catch (error) {
      logger.error("ADDRESSES_PAGE", `Erro ao remover cidade ${id}`, error);
      await showAlert("Erro ao remover cidade.");
    }
  }

  const handleToggleDelivery = async (cityId: string, enabled: boolean) => {
    if (!user?.companyId) {
      await showAlert("Erro: ID da empresa não encontrado no seu perfil.");
      return;
    }

    try {
      const settingDoc = citySettings.find(s => s.cityId === cityId && s.companyId === user.companyId);
      
      if (settingDoc) {
        await updateDoc(doc(firestore, "storeCitySettings", settingDoc.id), { enabled });
      } else {
        await addDoc(collection(firestore, "storeCitySettings"), { cityId, enabled, companyId: user.companyId });
      }
      logger.info("ADDRESSES_PAGE", `Delivery toggle para cidade ${cityId}: ${enabled}`);
    } catch (error) {
      const errMsg = error instanceof FirestoreError
        ? `Firestore (${error.code}): ${error.message}`
        : error instanceof Error ? error.message : String(error);
      logger.error("ADDRESSES_PAGE", `Erro ao alternar entrega: ${errMsg}`, error);
      await showAlert("Falha ao atualizar configuração de entrega. Verifique suas permissões.");
    }
  }

  const enableCityIfNeeded = async (cityId: string) => {
    if (!user?.companyId) return;
    const existing = citySettings.find(s => s.cityId === cityId && s.companyId === user.companyId);
    if (existing && existing.enabled) return;
    if (existing) {
      await updateDoc(doc(firestore, "storeCitySettings", existing.id), { enabled: true });
    } else {
      await addDoc(collection(firestore, "storeCitySettings"), { cityId, enabled: true, companyId: user.companyId });
    }
  };

  const handleSetDefaultPrice = async (cityId: string, price: number) => {
    if (!user?.companyId) return;
    try {
      const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", cityId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await showAlert("Nenhum bairro encontrado para esta cidade.");
        return;
      }

      const batch = writeBatch(firestore);
      snapshot.docs.forEach(d => {
        const nbId = d.id;
        const costSetting = deliveryCosts.find(c => c.neighborhoodId === nbId);
        
        const updates: any = { 
          deliveryPrice: price,
          neighborhoodId: nbId,
          companyId: user.companyId
        };
        if (price > 0) updates.enabled = true;

        if (costSetting) {
          batch.update(doc(firestore, "deliveryCosts", costSetting.id), updates);
        } else {
          batch.set(doc(collection(firestore, "deliveryCosts")), updates);
        }
      });
      await batch.commit();
      if (price > 0) await enableCityIfNeeded(cityId);
      logger.info("ADDRESSES_PAGE", `Preços atualizadopadronizados para cidade ${cityId}: R$${price}`);
      await showAlert("Preços atualizados com sucesso em todos os bairros!");
    } catch (error) {
      const errMsg = error instanceof FirestoreError
        ? `Firestore (${error.code}): ${error.message}`
        : error instanceof Error ? error.message : String(error);
      logger.error("ADDRESSES_PAGE", `Erro ao definir preço padrão: ${errMsg}`, error);
      await showAlert("Falha ao atualizar preços. Apenas proprietários podem realizar esta ação.");
    }
  };

  const handleToggleNb = async (nbId: string, enabled: boolean) => {
    if (!user?.companyId) return;
    try {
      const costSetting = deliveryCosts.find(c => c.neighborhoodId === nbId);
      if (costSetting) {
        await updateDoc(doc(firestore, "deliveryCosts", costSetting.id), { enabled });
      } else {
        await addDoc(collection(firestore, "deliveryCosts"), {
          neighborhoodId: nbId,
          companyId: user.companyId,
          enabled,
          deliveryPrice: 0
        });
      }
      if (enabled) {
        const nb = neighborhoods.find((n: any) => n.id === nbId);
        if (nb?.cityId) await enableCityIfNeeded(nb.cityId);
      }
      logger.info("ADDRESSES_PAGE", `Toggle bairro ${nbId}: ${enabled}`);
    } catch (error) {
      logger.error("ADDRESSES_PAGE", `Erro ao alternar bairro ${nbId}`, error);
    }
  };

  // Mesclar bairros com configurações da loja para exibição na tabela
  const enrichedNeighborhoods = neighborhoods.map(nb => {
    const cost = deliveryCosts.find(c => c.neighborhoodId === nb.id);

    return {
      ...nb,
      deliveryPrice: cost?.deliveryPrice ?? 0,
      enabled: cost?.enabled ?? false
    };
  });

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Regiões Atendidas</h1>
          <p className="page-subtitle">Gerencie as cidades e bairros onde o sistema opera</p>
        </div>
      </header>

<main className="page-content">{!isOwner && (<div className="info-banner"><ShieldAlert size={18} />Apenas proprietários podem alterar os dados desta página.</div>)}<CityTable cities={cities} selectedCityId={selectedCityId} onSelectCity={setSelectedCityId} onEditCity={(city) => setModalConfig({ type: 'city', data: city })} onDeleteCity={handleDeleteCity} isOwner={isOwner} isAdmin={isAdmin} onAddCity={() => setModalConfig({ type: 'city' })} onSetDefaultPrice={(cityId: string) => setModalConfig({ type: 'city_price', data: { cityId } })} citySettings={citySettings} onToggleDelivery={handleToggleDelivery} /><div className="mb-6 p-4 bg-brand-surface rounded-xl border border-brand-border flex items-center justify-between"><div><p className="font-bold text-sm text-brand-dark">Retirada na Loja</p><p className="text-xs text-brand-muted">Cliente pode retirar o pedido pessoalmente (frete grátis)</p></div><button onClick={async () => { if (!user?.companyId) return; const newValue = !pickupEnabled; setPickupEnabled(newValue); try { await updateDoc(doc(firestore, "companies", user.companyId), { pickupEnabled: newValue }); } catch (err) { logger.error("ADDRESSES_PAGE", "Erro ao salvar pickupEnabled", err); setPickupEnabled(!newValue); } }} className={`toggle-switch-button ${pickupEnabled ? 'active' : ''}`} aria-pressed={pickupEnabled}><span className="toggle-thumb" /></button></div><NeighborhoodTable neighborhoods={enrichedNeighborhoods} selectedCityId={selectedCityId} isOwner={isOwner} isAdmin={isAdmin} onAddNb={() => setModalConfig({ type: 'nb' })} onEditNb={(nb) => setModalConfig({ type: 'nb', data: nb })} onDeleteNb={async (id) => { try { await deleteDoc(doc(firestore, "neighborhoods", id)); } catch (error) { console.error("Erro ao remover bairro:", error); } }} onEditPrice={(nb) => setModalConfig({ type: 'price', data: nb })} onToggleNb={handleToggleNb} /></main>

      <Modal 
        isOpen={modalConfig.type !== null} 
        onClose={() => setModalConfig({ type: null })}
        title={modalConfig.type === 'city' ? 'Cidade' : modalConfig.type === 'nb' ? 'Bairro' : modalConfig.type === 'city_price' ? 'Preço Padrão (Cidade)' : 'Preço de Entrega'}
      >
        {modalConfig.type === 'city' && (
          <CityForm 
            initialData={modalConfig.data}
            onClose={() => setModalConfig({ type: null })}
            onSubmit={async (name) => {
              if (modalConfig.data?.id) {
                await updateDoc(doc(firestore, "cities", modalConfig.data.id), { name });
              } else {
                await addDoc(collection(firestore, "cities"), { name });
              }
            }}
          />
        )}

        {modalConfig.type === 'nb' && (
          <NeighborhoodForm 
            initialData={modalConfig.data}
            selectedCityId={selectedCityId}
            onClose={() => setModalConfig({ type: null })}
            onSubmit={async (name, cityId, deliveryPrice, enabled) => {
              let nbId = modalConfig.data?.id;
              if (modalConfig.data?.id) {
                await updateDoc(doc(firestore, "neighborhoods", nbId), { name });
              } else {
                const docRef = await addDoc(collection(firestore, "neighborhoods"), { name, cityId });
                nbId = docRef.id;
              }

              if (!user?.companyId) return;
              const costSetting = deliveryCosts.find(c => c.neighborhoodId === nbId);
              const costData = { 
                deliveryPrice, 
                enabled, 
                neighborhoodId: nbId, 
                companyId: user.companyId 
              };
              
              if (costSetting) {
                await updateDoc(doc(firestore, "deliveryCosts", costSetting.id), { deliveryPrice, enabled });
              } else {
                await addDoc(collection(firestore, "deliveryCosts"), costData);
              }
              if (enabled) await enableCityIfNeeded(cityId);
            }}
          />
        )}

        {modalConfig.type === 'price' && (
          <PriceForm 
            initialPrice={modalConfig.data?.deliveryPrice}
            onClose={() => setModalConfig({ type: null })}
            onSubmit={async (price) => {
              if (!user?.companyId) return;
              const nbId = modalConfig.data.id;
              const costSetting = deliveryCosts.find(c => c.neighborhoodId === nbId);
              const updates: any = { deliveryPrice: price };
              if (price > 0) updates.enabled = true;
              if (costSetting) {
                await updateDoc(doc(firestore, "deliveryCosts", costSetting.id), updates);
              } else {
                await addDoc(collection(firestore, "deliveryCosts"), { ...updates, neighborhoodId: nbId, companyId: user.companyId });
              }
              if (price > 0) {
                const nb = neighborhoods.find((n: any) => n.id === nbId);
                if (nb?.cityId) await enableCityIfNeeded(nb.cityId);
              }
            }}
          />
        )}

        {modalConfig.type === 'city_price' && (
          <PriceForm 
            onClose={() => setModalConfig({ type: null })}
            onSubmit={async (price) => {
              await handleSetDefaultPrice(modalConfig.data.cityId, price);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

export default function AddressesManagementPage() {
  return (
    <ErrorBoundary context="AddressesManagementPage">
      <AddressesManagementContent />
    </ErrorBoundary>
  );
}




















