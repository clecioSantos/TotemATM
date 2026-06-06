import { useState } from "react";
import "../../../products/components/ProductForm/styles.css";

export default function CategoryForm({ initialData, onSubmit }) {
  const [name, setName] = useState(initialData?.name || "");
  const [possuiTamanhos, setPossuiTamanhos] = useState(initialData?.possuiTamanhos || false);
  const [possuiSabores, setPossuiSabores] = useState(initialData?.possuiSabores || false);

  return (
    <form className="form-container" onSubmit={(e) => { e.preventDefault(); onSubmit({ id: initialData?.id, name, possuiTamanhos, possuiSabores }); }}>
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
        <input
          type="checkbox"
          id="cat-tamanhos"
          checked={possuiTamanhos}
          onChange={e => setPossuiTamanhos(e.target.checked)}
        />
        <label htmlFor="cat-tamanhos">Possui Tamanhos (P, M, G)</label>
      </div>
      <div className="checkbox-group">
        <input
          type="checkbox"
          id="cat-sabores"
          checked={possuiSabores}
          onChange={e => setPossuiSabores(e.target.checked)}
        />
        <label htmlFor="cat-sabores">Possui Sabores (Calabresa, Frango...)</label>
      </div>
      <button className="form-submit" type="submit">
        Salvar Categoria
      </button>
    </form>
  );
}
