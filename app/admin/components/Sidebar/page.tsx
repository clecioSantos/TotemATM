"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { MapPin, Plus, Trash2, ShieldAlert } from "lucide-react";
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import "./page.css";

export default function AddressesManagementPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [newCityName, setNewCityName] = useState("");
  const [newNeighborhoodName, setNewNeighborhoodName] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");

  useEffect(() => {
    const q = query(collection(firestore, "cities"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", selectedCityId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setNeighborhoods(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
      });
      return () => unsubscribe();
    } else {
      setNeighborhoods([]);
    }
  }, [selectedCityId]);

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !newCityName) return;
    await addDoc(collection(firestore, "cities"), { name: newCityName });
    setNewCityName("");
  };

  const handleAddNeighborhood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !newNeighborhoodName || !selectedCityId) return;
    await addDoc(collection(firestore, "neighborhoods"), { 
      name: newNeighborhoodName, 
      cityId: selectedCityId
    });
    setNewNeighborhoodName("");
  };

  return (
    <div className="addresses-view">
      <header className="header">
        <div className="page-title-area">
          <h2 className="page-title">Regiões Atendidas</h2>
          <p className="page-subtitle">Gerencie as cidades e bairros onde o sistema opera</p>
        </div>
      </header>

      {!isOwner && (
        <div className="info-banner" style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f0f7ff', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', color: '#0052cc', fontSize: '13px', fontWeight: 'bold' }}>
          <ShieldAlert size={18} />
          Apenas proprietários podem alterar os dados desta página.
        </div>
      )}

      <div className="settings-container">
        <div className="settings-card">
          <div className="location-management-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
            <div className="location-column">
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '12px', letterSpacing: '0.05em' }}>CIDADES</h4>
              {isOwner && (
                <form onSubmit={handleAddCity} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input type="text" placeholder="Nova cidade..." value={newCityName} onChange={e => setNewCityName(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd' }} />
                  <button type="submit" style={{ padding: '10px', background: '#ffbc0d', borderRadius: '10px', border: 'none', cursor: 'pointer' }}><Plus size={18} /></button>
                </form>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cities.map(city => (
                  <div key={city.id} onClick={() => setSelectedCityId(city.id)} style={{ padding: '12px', borderRadius: '10px', background: selectedCityId === city.id ? '#fff9c4' : '#f5f5f5', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{city.name}</span>
                    {isOwner && <button onClick={async (e) => { e.stopPropagation(); if(confirm('Excluir cidade?')) await deleteDoc(doc(firestore, "cities", city.id)); }} style={{ border: 'none', background: 'transparent', color: '#ff4d4f', cursor: 'pointer' }}><Trash2 size={14} /></button>}
                  </div>
                ))}
              </div>
            </div>

            <div className="location-column">
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '12px', letterSpacing: '0.05em' }}>BAIRROS</h4>
              {selectedCityId ? (
                <>
                  {isOwner && (
                    <form onSubmit={handleAddNeighborhood} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input type="text" placeholder="Novo bairro..." value={newNeighborhoodName} onChange={e => setNewNeighborhoodName(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd' }} />
                      <button type="submit" style={{ padding: '10px', background: '#ffbc0d', borderRadius: '10px', border: 'none', cursor: 'pointer' }}><Plus size={18} /></button>
                    </form>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {neighborhoods.map(nb => (
                      <div key={nb.id} style={{ padding: '12px', borderRadius: '10px', background: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px' }}>{nb.name}</span>
                        {isOwner && <button onClick={async () => { if(confirm('Excluir bairro?')) await deleteDoc(doc(firestore, "neighborhoods", nb.id)); }} style={{ border: 'none', background: 'transparent', color: '#ff4d4f', cursor: 'pointer' }}><Trash2 size={14} /></button>}
                      </div>
                    ))}
                  </div>
                </>
              ) : <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginTop: '40px' }}>Selecione uma cidade para ver os bairros</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
