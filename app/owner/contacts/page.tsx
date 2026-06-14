"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { MessageSquare, Send, Mail, Phone, Loader2, CheckCircle, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";

interface ContactMessage {
  id: string;
  subject: string;
  message: string;
  phone?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  companyId?: string;
  reply?: string;
  repliedAt?: any;
  createdAt?: any;
}

const subjectLabels: Record<string, string> = {
  question: "Pergunta",
  "add-company": "Quero adicionar minha empresa no Bora",
  complaint: "Reclamação",
};

function getCustomerKey(msg: ContactMessage): string {
  return msg.userId || msg.userEmail || msg.phone || msg.userName || msg.id;
}

function getCustomerLabel(msg: ContactMessage): string {
  return msg.userName || msg.userEmail || msg.phone || "Anônimo";
}

function ContactsContent() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [filterUnanswered, setFilterUnanswered] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(firestore, "contacts"), orderBy("createdAt", "desc")),
      (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage)));
        setLoading(false);
      },
      (err) => { logger.error("CONTACTS", "Erro ao carregar", err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const filteredMessages = useMemo(() => {
    return filterUnanswered ? messages.filter(m => !m.reply) : messages;
  }, [messages, filterUnanswered]);

  const groupedMessages = useMemo(() => {
    const groups: { key: string; label: string; hasUnanswered: boolean; lastDate: Date; messages: ContactMessage[] }[] = [];
    const map = new Map<string, ContactMessage[]>();

    for (const msg of filteredMessages) {
      const key = getCustomerKey(msg);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(msg);
    }

    for (const [key, msgs] of map) {
      const first = msgs[0];
      const lastDate = msgs.reduce((latest, m) => {
        const d = m.createdAt?.toDate?.() || new Date(0);
        return d > latest ? d : latest;
      }, new Date(0));
      groups.push({
        key,
        label: getCustomerLabel(first),
        hasUnanswered: msgs.some(m => !m.reply),
        lastDate,
        messages: msgs,
      });
    }

    groups.sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());
    return groups;
  }, [filteredMessages]);

  const unansweredCount = messages.filter(m => !m.reply).length;

  const handleReply = async (msg: ContactMessage) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await updateDoc(doc(firestore, "contacts", msg.id), {
        reply: replyText.trim(),
        repliedAt: serverTimestamp(),
      });

      if (msg.userId) {
        await addDoc(collection(firestore, "notifications"), {
          userId: msg.userId,
          type: "contact_reply",
          title: "Resposta do Contato",
          message: `Sua mensagem "${subjectLabels[msg.subject] || msg.subject}" foi respondida.`,
          relatedOrderId: "",
          relatedContactId: msg.id,
          isRead: false,
          isResolved: false,
          createdAt: serverTimestamp(),
        });
      }

      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      logger.error("CONTACTS", "Erro ao responder", err);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center gap-3 text-gray-400"><Loader2 size={24} className="animate-spin" /><p>Carregando...</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
          <MessageSquare size={24} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Mensagens de Contato</h1>
          <p className="text-sm text-gray-500">
            {messages.length} mensagens
            {unansweredCount > 0 && (
              <span className="ml-2 text-orange-600 font-medium">· {unansweredCount} não respondidas</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setFilterUnanswered(!filterUnanswered)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filterUnanswered
              ? "bg-orange-100 text-orange-700 border border-orange-200"
              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
          }`}
        >
          <Filter size={16} />
          {filterUnanswered ? "Não respondidas" : "Todas"}
        </button>
      </div>

      {groupedMessages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Mail size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">{filterUnanswered ? "Todas respondidas!" : "Nenhuma mensagem recebida"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedMessages.map((group) => {
            const isExpanded = expandedCustomer === group.key;
            return (
              <div key={group.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedCustomer(isExpanded ? null : group.key)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {group.label.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900">{group.label}</p>
                      <p className="text-xs text-gray-500">
                        {group.messages.length} {group.messages.length === 1 ? "mensagem" : "mensagens"}
                        {group.hasUnanswered && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-orange-500" title="Não respondida" />
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">
                      {group.lastDate.toLocaleDateString()}
                    </span>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {group.messages.map((msg) => (
                      <div key={msg.id} className="p-4 pl-14">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold">
                              {subjectLabels[msg.subject] || msg.subject}
                            </span>
                            {msg.reply ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle size={10} /> Respondida
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-[10px] font-bold">
                                Pendente
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {msg.createdAt?.toDate?.().toLocaleString() || ""}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{msg.message}</p>

                        {msg.phone && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                            <Phone size={12} /> {msg.phone}
                          </p>
                        )}

                        {msg.reply && (
                          <div className="ml-2 pl-3 border-l-2 border-green-300 bg-green-50 rounded-r-lg p-3 mb-2">
                            <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Resposta</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.reply}</p>
                          </div>
                        )}

                        {replyingId === msg.id ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Digite sua resposta..."
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-purple-500 transition-colors resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReply(msg)}
                                disabled={!replyText.trim() || sendingReply}
                                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-all disabled:opacity-50"
                              >
                                {sendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Enviar
                              </button>
                              <button onClick={() => { setReplyingId(null); setReplyText(""); }} className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          !msg.reply && (
                            <button
                              onClick={() => { setReplyingId(msg.id); setReplyText(""); }}
                              className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors mt-2"
                            >
                              <Mail size={14} /> Responder
                            </button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ContactsPage() {
  return <ErrorBoundary context="ContactsPage"><ContactsContent /></ErrorBoundary>;
}
