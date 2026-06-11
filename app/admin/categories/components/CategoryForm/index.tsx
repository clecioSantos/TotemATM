import { useState } from "react";
import "../../../products/components/ProductForm/styles.css";

export default function CategoryForm({ initialData, onSubmit, isInsideForm = false }) {
  const [name, setName] = useState(initialData?.name || "");
  const [possuiTamanhos, setPossuiTamanhos] = useState(initialData?.possuiTamanhos || false);
  const [possuiSabores, setPossuiSabores] = useState(initialData?.possuiSabores || false);
  const [schedulingMode, setSchedulingMode] = useState(initialData?.schedulingMode || "none");
  const [minimumPreparationMinutes, setMinimumPreparationMinutes] = useState(initialData?.minimumPreparationMinutes || 60);
  const [requiresCustomerContact, setRequiresCustomerContact] = useState(initialData?.requiresCustomerContact || false);
  const [customerInstructions, setCustomerInstructions] = useState(initialData?.customerInstructions || "");

  const handleSubmit = (e) => {
    if (!isInsideForm) e.preventDefault();
    onSubmit({
      id: initialData?.id,
      name,
      possuiTamanhos,
      possuiSabores,
      schedulingMode,
      minimumPreparationMinutes: schedulingMode !== "none" ? minimumPreparationMinutes : undefined,
      requiresCustomerContact: schedulingMode !== "none" ? requiresCustomerContact : undefined,
      customerInstructions: requiresCustomerContact ? customerInstructions : undefined,
    });
  };

  const Tag = isInsideForm ? "div" : "form";

  return (
    <Tag className="form-container" onSubmit={isInsideForm ? undefined : handleSubmit}>
      <div className="input-group">
        <label>Nome da Categoria</label>
        <input
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Lanches, Bebidas..."
          required
        />
      </div>
      <div className="checkbox-group">
        <input type="checkbox" id="cat-tamanhos" checked={possuiTamanhos} onChange={e => setPossuiTamanhos(e.target.checked)} />
        <label htmlFor="cat-tamanhos">Possui Tamanhos (P, M, G)</label>
      </div>
      <div className="checkbox-group">
        <input type="checkbox" id="cat-sabores" checked={possuiSabores} onChange={e => setPossuiSabores(e.target.checked)} />
        <label htmlFor="cat-sabores">Possui Sabores (Calabresa, Frango...)</label>
      </div>

      <div className="input-group" style={{ marginTop: 16 }}>
        <label>Modo de Agendamento</label>
        <select className="form-input" value={schedulingMode} onChange={e => setSchedulingMode(e.target.value)}>
          <option value="none">Não permite agendamento</option>
          <option value="optional">Pode ser agendado</option>
          <option value="required">Deve ser agendado</option>
        </select>
      </div>

      {schedulingMode !== "none" && (
        <>
          <div className="input-group">
            <label>Tempo mínimo de preparo (horas)</label>
            <input
              className="form-input"
              type="number"
              min={1}
              value={minimumPreparationMinutes / 60}
              onChange={e => setMinimumPreparationMinutes(Number(e.target.value) * 60)}
              placeholder="Ex: 2 para 2 horas"
            />
          </div>
          <div className="checkbox-group">
            <input type="checkbox" id="cat-contact" checked={requiresCustomerContact} onChange={e => setRequiresCustomerContact(e.target.checked)} />
            <label htmlFor="cat-contact">Requer alinhamento com o cliente</label>
          </div>
          {requiresCustomerContact && (
            <div className="input-group">
              <label>Instruções para o cliente</label>
              <textarea
                className="form-input form-textarea"
                rows={3}
                value={customerInstructions}
                onChange={e => setCustomerInstructions(e.target.value)}
                placeholder="Ex: Envie nome, tema, cores e foto de referência..."
              />
            </div>
          )}
        </>
      )}

      <button className="form-submit" type={isInsideForm ? "button" : "submit"} onClick={isInsideForm ? handleSubmit : undefined}>
        Salvar Categoria
      </button>
    </Tag>
  );
}