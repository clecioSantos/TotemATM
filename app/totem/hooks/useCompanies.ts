import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore as db } from '@/src/services/firebase';

export interface Company {
  id: string;
  name: string;
}

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.id
      })) as Company[];
      setCompanies(items);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar empresas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { companies, loading };
};
