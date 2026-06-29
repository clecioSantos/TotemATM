import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

type AuditAction =
  | "termos_visualizados"
  | "termos_aceites"
  | "termos_publicados"
  | "dados_exportados"
  | "exclusao_solicitada"
  | "exclusao_executada"
  | "exclusao_negada"
  | "consentimento_atualizado"
  | "dados_atualizados"
  | "admin_alteracao";

type AuditType =
  | "consentimento"
  | "documento_legal"
  | "privacidade"
  | "exclusao"
  | "exportacao"
  | "administrativo";

export async function createAuditLog(params: {
  usuario: string;
  acao: AuditAction;
  tipo: AuditType;
  detalhes?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await addDoc(collection(firestore, "audit_logs"), {
      data: serverTimestamp(),
      usuario: params.usuario,
      acao: params.acao,
      tipo: params.tipo,
      detalhes: params.detalhes || "",
      metadata: params.metadata || {},
    });
  } catch (error) {
    console.error("Erro ao criar log de auditoria:", error);
  }
}
