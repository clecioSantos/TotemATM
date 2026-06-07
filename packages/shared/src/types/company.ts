import { StoreUser } from './auth';

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  users: StoreUser[];
  razaoSocial?: string;
  cnpj?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  logo?: string;
  banner?: string;
  endereco?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  numero?: string;
  areasAtuacao?: string[];
  horario?: {
    seg: { open: string; close: string };
    ter: { open: string; close: string };
    qua: { open: string; close: string };
    qui: { open: string; close: string };
    sex: { open: string; close: string };
    sab: { open: string; close: string };
    dom: { open: string; close: string };
  };
  tempoPreparoMin?: number;
  tempoPreparoMax?: number;
  open?: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: Date;
}
