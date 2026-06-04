import React from "react";
import { Trash2, Edit2, Plus, DollarSign, MapPinOff, MapPin } from "lucide-react";

interface NeighborhoodTableProps {
  neighborhoods: any[];
  selectedCityId: string;
  onEditNb: (nb: any) => void;
  onDeleteNb: (nbId: string) => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  onAddNb: () => void;
  onEditPrice: (nb: any) => void;
  onToggleNb: (nbId: string, enabled: boolean) => Promise<void>;
}

export default function NeighborhoodTable({
  neighborhoods,
  selectedCityId,
  onEditNb,
  onDeleteNb,
  isOwner,
  isAdmin,
  onAddNb,
  onEditPrice,
  onToggleNb,
}: NeighborhoodTableProps) {
  return (
    <div className="table-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 16px 4px' }}>
        <h4 className="column-label" style={{ margin: 0 }}>BAIRROS</h4>
        {selectedCityId && isOwner && (
          <button className="add-btn-small" onClick={onAddNb} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '900', color: '#ffbc0d', border: 'none', background: 'none', cursor: 'pointer' }}>
            <Plus size={14} /> NOVO BAIRRO
          </button>
        )}
      </div>
      <div className="table-wrapper">
        <table className="p-table">
          <thead>
            <tr>
              <th>Nome do Bairro</th>
              <th style={{ textAlign: 'center' }}>Custo Entrega</th>
              {(isOwner || isAdmin) && <th className="actions-cell" style={{ textAlign: 'right' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {neighborhoods.map((nb) => (
              <tr key={nb.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {nb.name}
                    {nb.enabled === false && (
                      <span style={{ fontSize: '9px', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>INATIVO</span>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                      R$ {nb.deliveryPrice?.toFixed(2) || "0.00"}
                    </span>
                    {(isOwner || isAdmin) && (
                      <button onClick={() => onEditPrice(nb)} className="btn-action-text btn-price" style={{ margin: 0, padding: '4px 8px' }}>
                        <DollarSign size={14} /> Alterar
                      </button>
                    )}
                  </div>
                </td>
                {(isOwner || isAdmin) && (
                  <td className="actions-cell" style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onToggleNb(nb.id, nb.enabled === false)}
                      className="btn-action-text"
                      style={{
                        backgroundColor: nb.enabled !== false ? '#dcfce7' : '#fee2e2',
                        color: nb.enabled !== false ? '#166534' : '#991b1b',
                        borderColor: nb.enabled !== false ? '#16653433' : '#991b1b33',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={nb.enabled !== false ? "Desativar Bairro" : "Ativar Bairro"}
                    >
                      {nb.enabled !== false ? <MapPin size={12} /> : <MapPinOff size={12} />}
                      {nb.enabled !== false ? "ATIVO" : "INATIVO"}
                    </button>
                    {isOwner && (
                      <>
                        <button onClick={() => onEditNb(nb)} className="btn-action btn-edit"><Edit2 size={14} /></button>
                        <button onClick={() => { if (confirm('Excluir bairro?')) onDeleteNb(nb.id); }} className="btn-action btn-delete"><Trash2 size={14} /></button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {neighborhoods.length === 0 && <p className="empty-msg" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Nenhum bairro nesta cidade.</p>}
      </div>
    </div>
  );
}
