"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { MapPin, ShieldAlert } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import "./page.css";

export default function AddressesManagementPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
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

  return (
    <div className="addresses-view">
      <header className="header">
        <div className="page-title-area">
          <h2 className="page-title">Regiões Atendidas</h2>
          <p className="page-subtitle">Gerencie as cidades e bairros onde o sistema opera</p>
        </div>
      </header>

      <div className="settings-container">
        <div className="settings-card">
          <div className="location-management-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
            <div className="location-column">
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '12px', letterSpacing: '0.05em' }}>CIDADES</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cities.map(city => (
                  <div key={city.id} onClick={() => setSelectedCityId(city.id)} style={{ padding: '12px', borderRadius: '10px', background: selectedCityId === city.id ? '#fff9c4' : '#f5f5f5', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{city.name}</span>

                  </div>
                ))}
              </div>
            </div>

            <div className="location-column">
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '12px', letterSpacing: '0.05em' }}>BAIRROS</h4>
              {selectedCityId ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {neighborhoods.map(nb => (
                      <div key={nb.id} style={{ padding: '12px', borderRadius: '10px', background: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px' }}>{nb.name}</span>

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
