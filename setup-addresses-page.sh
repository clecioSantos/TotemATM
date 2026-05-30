#!/bin/bash

# Define o caminho da nova página
TARGET_DIR="apps/app/admin/addresses"

echo "🚀 Criando estrutura para a página de Endereços..."

# Cria o diretório se não existir
mkdir -p "$TARGET_DIR"

# Cria o arquivo page.tsx com a lógica de permissões e gerenciamento
cat <<EOF > "$TARGET_DIR/page.tsx"
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { MapPin, Plus, Trash2, ShieldAlert, Info } from "lucide-react";
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
      setCities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", selectedCityId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setNeighborhoods(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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
          <p className="page-subtitle">Cidades e bairros globais para entrega</p>
        </div>
      </header>

      {!isOwner && (
        <div className="owner-only-banner">
          <ShieldAlert size={18} />
          <span>Modo de Visualização: Apenas proprietários podem realizar alterações.</span>
        </div>
      )}

      <div className="addresses-container">
        <div className="addresses-card">
          <div className="location-grid">
            {/* Coluna de Cidades */}
            <div className="location-column">
              <h4 className="column-label">CIDADES</h4>
              {isOwner && (
                <form onSubmit={handleAddCity} className="location-form">
                  <input 
                    type="text" 
                    placeholder="Nova cidade..." 
                    value={newCityName} 
                    onChange={e => setNewCityName(e.target.value)} 
                  />
                  <button type="submit"><Plus size={18} /></button>
                </form>
              )}
              <div className="location-list">
                {cities.map(city => (
                  <div 
                    key={city.id} 
                    onClick={() => setSelectedCityId(city.id)} 
                    className={\`location-item \${selectedCityId === city.id ? 'active' : ''}\`}
                  >
                    <span>{city.name}</span>
                    {isOwner && (
                      <button onClick={async (e) => { 
                        e.stopPropagation(); 
                        if(confirm('Excluir cidade?')) await deleteDoc(doc(firestore, "cities", city.id)); 
                      }} className="delete-btn">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna de Bairros */}
            <div className="location-column">
              <h4 className="column-label">BAIRROS</h4>
              {selectedCityId ? (
                <>
                  {isOwner && (
                    <form onSubmit={handleAddNeighborhood} className="location-form">
                      <input 
                        type="text" 
                        placeholder="Novo bairro..." 
                        value={newNeighborhoodName} 
                        onChange={e => setNewNeighborhoodName(e.target.value)} 
                      />
                      <button type="submit"><Plus size={18} /></button>
                    </form>
                  )}
                  <div className="location-list">
                    {neighborhoods.map(nb => (
                      <div key={nb.id} className="location-item static">
                        <span>{nb.name}</span>
                        {isOwner && (
                          <button onClick={async () => { 
                            if(confirm('Excluir bairro?')) await deleteDoc(doc(firestore, "neighborhoods", nb.id)); 
                          }} className="delete-btn">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {neighborhoods.length === 0 && <p className="empty-msg">Nenhum bairro cadastrado.</p>}
                  </div>
                </>
              ) : (
                <div className="selection-placeholder">
                  <Info size={32} />
                  <p>Selecione uma cidade para gerenciar os bairros</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Cria o arquivo page.css com estilização premium
cat <<EOF > "$TARGET_DIR/page.css"
.addresses-view { padding: 0; }
.owner-only-banner { display: flex; gap: 10px; align-items: center; background: #fff1f0; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; color: #cf1322; border: 1px solid #ffa39e; font-size: 13px; font-weight: 600; }
.addresses-card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); }
.location-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; }
.column-label { font-size: 11px; font-weight: 900; color: #a1a1aa; letter-spacing: 0.1em; margin-bottom: 16px; }
.location-form { display: flex; gap: 8px; margin-bottom: 20px; }
.location-form input { flex: 1; padding: 12px 16px; border-radius: 12px; border: 2px solid #f4f4f5; font-weight: 600; outline: none; transition: all 0.2s; }
.location-form input:focus { border-color: #ffbc0d; background: #fff; }
.location-form button { background: #ffbc0d; border: none; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.location-form button:hover { transform: scale(1.05); background: #eab308; }
.location-list { display: flex; flexDirection: column; gap: 8px; }
.location-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 14px; background: #fafafa; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; font-weight: 700; color: #3f3f46; }
.location-item:hover { background: #f4f4f5; }
.location-item.active { background: #fff9c4; border-color: #ffbc0d; color: #854d0e; }
.location-item.static { cursor: default; }
.delete-btn { color: #f87171; border: none; background: transparent; cursor: pointer; padding: 4px; opacity: 0.6; transition: all 0.2s; }
.delete-btn:hover { color: #ef4444; opacity: 1; transform: scale(1.1); }
.selection-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #d4d4d8; text-align: center; gap: 12px; min-height: 200px; }
.selection-placeholder p { font-size: 14px; font-weight: 600; max-width: 200px; }
.empty-msg { font-size: 13px; color: #a1a1aa; text-align: center; padding: 20px; }

@media (max-width: 1024px) {
  .location-grid { grid-template-columns: 1fr; gap: 32px; }
}
EOF

echo "✅ Estrutura de endereços criada com sucesso!"
echo "👉 Lembre-se de rodar 'chmod +x setup-addresses-page.sh' se estiver no Linux/Mac."