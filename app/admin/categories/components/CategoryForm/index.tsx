import { useState } from "react";
import "./styles.css";

export default function CategoryForm({ initialData, onSubmit }) {
  const [name, setName] = useState(initialData?.name || "");

  return (
    <form className="category-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ id: initialData?.id, name }); }}>
      <div className="category-input-wrapper">
        <label>Nome da Categoria</label>
        <input 
          className="category-input"
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Ex: Lanches, Bebidas..." 
          required 
        />
      </div>
      <button className="category-submit-button" type="submit">
        Salvar Categoria
      </button>
    </form>
  );
}
