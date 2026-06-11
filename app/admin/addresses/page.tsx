"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { useStorePermissions } from "@/src/hooks/useStorePermissions";
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
        setCities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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
            setNeighborhoods(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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

  // Carregar Configurações de Cidade
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

  // Ações de Cidade
  const handleDeleteCity = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "cities", id));
      if (selectedCityId === id) setSelectedCityId("");
      logger.info("ADDRESSES_PAGE", `Cidade ${id} removida`);
    } catch (error) {
      logger.error("ADDRESSES_PAGE", `Erro ao remover cidade ${id}`, error);
      alert("Erro ao remover cidade.");
    }
  }

  const handleToggleDelivery = async (cityId: string, enabled: boolean) => {
    if (!user?.companyId) {
      alert("Erro: ID da empresa não encontrado no seu perfil.");
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
      alert("Falha ao atualizar configuração de entrega. Verifique suas permissões.");
    }
  }

  const handleSetDefaultPrice = async (cityId: string, price: number) => {
    if (!user?.companyId) return;
    try {
      const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", cityId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert("Nenhum bairro encontrado para esta cidade.");
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
      logger.info("ADDRESSES_PAGE", `Preços padronizados para cidade ${cityId}: R$${price}`);
      alert("Preços atualizados com sucesso em todos os bairros!");
    } catch (error) {
      const errMsg = error instanceof FirestoreError
        ? `Firestore (${error.code}): ${error.message}`
        : error instanceof Error ? error.message : String(error);
      logger.error("ADDRESSES_PAGE", `Erro ao definir preço padrão: ${errMsg}`, error);
      alert("Falha ao atualizar preços. Apenas proprietários podem realizar esta ação.");
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

      {!isOwner && (
        <div className="info-banner">
          <ShieldAlert size={18} />
          Apenas proprietários podem alterar os dados desta página.
        </div>
      )}

      <div className="mb-6 p-4 bg-brand-surface rounded-xl border border-brand-border flex items-center justify-between">
        <div>
          <p className="font-bold text-sm text-brand-dark">Retirada na Loja</p>
          <p className="text-xs text-brand-muted">Cliente pode retirar o pedido pessoalmente (frete grátis)</p>
        </div>
        <button
          onClick={async () => {
            if (!user?.companyId) return;
            const newValue = !pickupEnabled;
            setPickupEnabled(newValue);
            try {
              await updateDoc(doc(firestore, "companies", user.companyId), { pickupEnabled: newValue });
            } catch (err) {
              logger.error("ADDRESSES_PAGE", "Erro ao salvar pickupEnabled", err);
              setPickupEnabled(!newValue);
            }
          }}
          className={`relative w-12 h-6 rounded-full transition-all ${
            pickupEnabled ? 'bg-brand-primary' : 'bg-brand-border'
          }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
            pickupEnabled ? 'translate-x-6' : ''
          }`} />
        </button>
      </div>

      <div className="addresses-vertical-list">
        <CityTable 
          cities={cities}
          selectedCityId={selectedCityId}
          onSelectCity={setSelectedCityId}
          isOwner={isOwner}
          isAdmin={isAdmin}
          citySettings={citySettings}
          onAddCity={() => setModalConfig({ type: 'city' })}
          onEditCity={(city) => setModalConfig({ type: 'city', data: city })}
          onDeleteCity={handleDeleteCity}
          onToggleDelivery={handleToggleDelivery}
          onSetDefaultPrice={(id) => setModalConfig({ type: 'city_price', data: { cityId: id } })}
        />

        <NeighborhoodTable 
          neighborhoods={enrichedNeighborhoods}
          selectedCityId={selectedCityId}
          isOwner={isOwner}
          isAdmin={isAdmin}
          onAddNb={() => setModalConfig({ type: 'nb' })}
          onEditNb={(nb) => setModalConfig({ type: 'nb', data: nb })}
          onDeleteNb={async (id) => {
            try { await deleteDoc(doc(firestore, "neighborhoods", id)); }
            catch (error) { console.error("🔥 Erro ao remover bairro:", error); }
          }}
          onEditPrice={(nb) => setModalConfig({ type: 'price', data: nb })}
          onToggleNb={handleToggleNb}
        />
      </div>

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
