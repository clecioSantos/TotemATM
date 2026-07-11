"use client";

import React from "react";
import { Trash2, Edit2, Plus, DollarSign, Truck } from "lucide-react";
import { useConfirm } from "@/app/components/ConfirmProvider";

interface CityTableProps {
  cities: any[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  onEditCity: (city: any) => void;
  onDeleteCity: (cityId: string) => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  onAddCity: () => void;
  onSetDefaultPrice: (cityId: string) => void;
  citySettings: any[];
  onToggleDelivery: (cityId: string, enabled: boolean) => void;
}

export default function CityTable({
  cities,
  selectedCityId,
  onSelectCity,
  onEditCity,
  onDeleteCity,
  isOwner,
  isAdmin,
  onAddCity,
  onSetDefaultPrice,
  citySettings,
  onToggleDelivery,
}: CityTableProps) {
  const { showConfirm } = useConfirm();
  return (
    <div className="table-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 16px 4px' }}>
        <h4 className="column-label" style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>CIDADES</h4>
        {isOwner && (
          <button className="add-btn-small" onClick={onAddCity} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '900', color: '#ffbc0d', border: 'none', background: 'none', cursor: 'pointer' }}>
            <Plus size={14} /> NOVA CIDADE
          </button>
        )}
      </div>
      <div className="table-wrapper">
        <table className="p-table">
          <thead>
            <tr>
              <th>Nome da Cidade</th>
              {(isOwner || isAdmin) && <th className="actions-cell" style={{ textAlign: 'right' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {cities.map((city) => {
              const setting = citySettings.find(s => s.cityId === city.id);
              const isDeliveryEnabled = setting?.enabled === true;

              return (
                <tr 
                  key={city.id} 
                  onClick={() => onSelectCity(city.id)}
                  className={selectedCityId === city.id ? "active-row" : ""}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong>{city.name}</strong>
                    </div>
                  </td>
                  {(isOwner || isAdmin) && (
                    <td className="actions-cell">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onToggleDelivery(city.id, !isDeliveryEnabled); }}
                          className={`btn-action-text ${isDeliveryEnabled ? 'btn-active' : 'btn-inactive'}`}
                        >
                          <Truck size={14} />
                          {isDeliveryEnabled ? "ENTREGA ATIVA" : "ATIVAR ENTREGA"}
                        </button>

                        {isOwner && (
                          <button onClick={(e) => { e.stopPropagation(); onSetDefaultPrice(city.id); }} className="btn-action-text btn-price">
                            <DollarSign size={14} /> PREÇO PADRÃO
                          </button>
                        )}

                        {isOwner && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={(e) => { e.stopPropagation(); onEditCity(city); }} className="action-btn action-btn-edit"><Edit2 size={14} /></button>
                            <button onClick={async (e) => { e.stopPropagation(); if (await showConfirm('Excluir cidade?')) onDeleteCity(city.id); }} className="action-btn action-btn-delete"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}




