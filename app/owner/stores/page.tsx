"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "companies"), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStores(data);
    }, (error) => {
      console.error("🔥 Erro ao carregar lojas:", error);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      if (confirm("Tem certeza que deseja excluir esta loja?")) {
        await deleteDoc(doc(firestore, "companies", id));
      }
    } catch (error) {
      console.error("🔥 Erro ao remover loja:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Lojas</h1>
        <Link href="/owner/stores/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          Nova Loja
        </Link>
      </div>
      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <table className="min-w-full">
            <thead>
                <tr className="border-b">
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Cidade</th>
                    <th className="text-left py-2">Ações</th>
                </tr>
            </thead>
            <tbody>
                {stores.map(store => (
                    <tr key={store.id} className="border-b">
                        <td className="py-2">{store.name}</td>
                        <td className="py-2">{store.cidade}</td>
                        <td className="py-2 flex gap-2">
                            <Link href={`/owner/stores/edit/${store.id}`} className="text-blue-600 underline">Editar</Link>
                            <button onClick={() => handleDelete(store.id)} className="text-red-600 underline">Remover</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
