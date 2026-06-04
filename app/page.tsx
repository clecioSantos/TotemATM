"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/src/services/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import Link from "next/link";
import { Star, Search, MapPin } from "lucide-react";

export default function HomePage() {
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(firestore, "companies"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-brand-light pb-20">
      {/* Header Estilo Veloce */}
      <header className="sticky top-0 bg-brand-surface z-10 p-4 border-b border-brand-border">
        <div className="flex items-center text-sm font-semibold mb-3">
          <MapPin className="h-4 w-4 text-brand-primary" />
          <span className="ml-2">Onde você está?</span>
        </div>
        <div className="bg-[#F0F0F0] h-12 rounded-[12px] flex items-center px-4 text-brand-muted text-sm">
          <Search className="h-4 w-4 mr-3" />
          Buscar lojas
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="p-4">
        <h3 className="text-xl font-bold mb-4 mt-2">Unidades Disponíveis</h3>
        
        <div className="flex flex-col gap-4">
          {stores.map((store) => (
            <Link 
              key={store.id} 
              href={`/totem/${store.id}`}
              className="bg-brand-surface rounded-[16px] p-4 flex gap-4 items-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brand-border transition-transform active:scale-[0.98]"
            >
              <div className="w-16 h-16 bg-[#eee] rounded-[12px] flex items-center justify-center text-2xl font-bold">
                {store.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-brand-dark mb-1">{store.name}</h4>
                <div className="flex items-center text-xs text-brand-muted gap-2">
                  <span className="text-brand-alert font-bold">⭐ 4.8</span> 
                  <span>• 30-40 min</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
