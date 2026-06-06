import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore as db } from '@/src/services/firebase';
import { logger } from '@/src/lib/logger';

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
      try {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.id,
        })) as Company[];
        setCompanies(items);
        setLoading(false);
      } catch (mapError) {
        logger.error("useCompanies", "Erro ao processar empresas", mapError);
        setLoading(false);
      }
    }, (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("useCompanies", `Erro ao buscar empresas: ${errMsg}`, err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { companies, loading };
};
