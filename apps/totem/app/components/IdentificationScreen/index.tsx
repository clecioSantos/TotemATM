"use client";

interface IdentificationScreenProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export default function IdentificationScreen({
  customerName, setCustomerName, tableNumber, setTableNumber, onConfirm, onBack
}: IdentificationScreenProps) {
  return (
    <div className="identification-screen">
      <div className="identification-card">
        <h1>Quase lá!</h1>
        <p>Informe seu nome e o número da mesa para entregarmos seu pedido.</p>
        
        <div className="id-inputs">
          <div className="input-group">
            <label>Seu Nome</label>
            <input 
              type="text" 
              placeholder="Como quer ser chamado?" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="totem-input-large"
            />
          </div>
          <div className="input-group">
            <label>Número da Mesa</label>
            <input 
              type="number" 
              placeholder="00" 
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="totem-input-large"
            />
          </div>
        </div>

        <button className="confirm-btn" disabled={!customerName || !tableNumber} onClick={onConfirm}>
          CONFIRMAR E ENVIAR
        </button>
        <button className="back-btn" onClick={onBack}>VOLTAR PARA O PEDIDO</button>
      </div>
    </div>
  );
}