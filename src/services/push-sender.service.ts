import { getAdminMessaging, getAdminDb } from "./firebase-admin";
import { logger } from "@/src/lib/logger";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const pushSender = {
  async sendToUser(uid: string, payload: PushPayload): Promise<void> {
    try {
      const db = getAdminDb();
      const allTokensSnap = await db.collection("push_tokens")
        .where("uid", "==", uid)
        .get();

      let tokens = allTokensSnap.docs
        .filter((d) => d.data().active === true)
        .map((d) => d.data().token as string);

      if (tokens.length === 0) {
        logger.warn("PUSH_SEND", "Nenhum token ativo para o usuário", { uid });
        return;
      }

      logger.info("PUSH_SEND", "Enviando push para usuário", {
        uid,
        tokensCount: tokens.length,
        preview: tokens[0]?.slice(0, 24),
      });

      const messaging = getAdminMessaging();
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.data || {},
      });

      const successCount = response.successCount;
      const failureCount = response.failureCount;
      logger.info("PUSH_SEND", "Resultado do envio", { uid, successCount, failureCount });

      await handleSendResponse(response, tokens, uid);
    } catch (error) {
      logger.error("PUSH_SEND", "Erro ao enviar push para usuário", error, { uid });
    }
  },

  async sendToStore(companyId: string, payload: PushPayload): Promise<void> {
    try {
      const db = getAdminDb();

      // Diagnóstico: listar TODOS os registros no banco
      try {
        const allSnap = await db.collection("push_tokens").limit(10).get();
        const registros = allSnap.docs.map((d) => ({
          docId: d.id,
          uid: d.data().uid,
          ativo: d.data().active,
          plat: d.data().platform,
          preview: (d.data().token as string)?.slice(0, 24),
        }));
        logger.info("PUSH_SEND", "Diagnóstico - registros push_tokens:", { total: allSnap.docs.length, registros });
      } catch (diagErr) {
        logger.error("PUSH_SEND", "Diagnóstico - erro ao ler", diagErr);
      }

      const usersSnap = await db.collection("users")
        .where("companyId", "==", companyId)
        .get();

      const uids = usersSnap.docs.map((d) => d.id);

      logger.info("PUSH_SEND", "sendToStore", {
        companyId,
        usersFound: uids.length,
        uids,
      });

      for (const uid of uids) {
        await pushSender.sendToUser(uid, payload);
      }
    } catch (error) {
      logger.error("PUSH_SEND", "Erro ao enviar push para loja", error, { companyId });
    }
  },

  async sendToRole(role: string, payload: PushPayload): Promise<void> {
    try {
      const db = getAdminDb();
      const usersSnap = await db.collection("users")
        .where("role", "==", role)
        .get();

      const uids = usersSnap.docs.map((d) => d.id);

      for (const uid of uids) {
        await pushSender.sendToUser(uid, payload);
      }
    } catch (error) {
      logger.error("PUSH_SEND", "Erro ao enviar push para role", error, { role });
    }
  },

  async sendToToken(token: string, payload: PushPayload): Promise<void> {
    try {
      const messaging = getAdminMessaging();
      await messaging.send({
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data || {},
      });
      logger.info("PUSH_SEND", "Push enviado para token individual");
    } catch (error) {
      logger.error("PUSH_SEND", "Erro ao enviar push para token", error);
    }
  },
};

async function handleSendResponse(response: any, tokens: string[], uid: string): Promise<void> {
  const db = getAdminDb();
  const invalidTokens: string[] = [];

  response.responses.forEach((resp: any, idx: number) => {
    if (!resp.success) {
      const errorCode = resp.error?.code;
      if (errorCode === "messaging/invalid-registration-token" || errorCode === "messaging/registration-token-not-registered") {
        invalidTokens.push(tokens[idx]);
      } else {
        logger.warn("PUSH_SEND", "Falha ao enviar para token", { error: errorCode, idx });
      }
    }
  });

  if (invalidTokens.length > 0) {
    const batch = db.batch();
    const tokenDocs = await db.collection("push_tokens")
      .where("uid", "==", uid)
      .where("active", "==", true)
      .get();

    tokenDocs.docs.forEach((doc) => {
      if (invalidTokens.includes(doc.data().token)) {
        batch.update(doc.ref, { active: false });
      }
    });
    await batch.commit();
    logger.info("PUSH_SEND", "Tokens inválidos desativados", { count: invalidTokens.length });
  }
}
