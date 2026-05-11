import { useState } from "react";
export default function CategoryForm({ initialData, onSubmit }) {
  const [name, setName] = useState(initialData?.name || "");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ id: initialData?.id, name }); }}>
      <input 
        style={{width: '100%', height: '48px', padding: '0 12px', borderRadius: '8px', border: '1px solid #ddd'}}
        value={name} 
        onChange={e => setName(e.target.value)} 
        placeholder="Ex: Lanches, Bebidas..." 
        required 
      />
      <button style={{width: '100%', height: '48px', marginTop: '16px', background: '#000', color: '#fff', borderRadius: '8px', cursor: 'pointer'}} type="submit">
        Salvar Categoria
      </button>
    </form>
  );
}
