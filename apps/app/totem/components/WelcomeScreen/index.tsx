"use client";
import { useState } from "react";
import { LogOut, User, Building2, X, Check, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { firestore, auth } from "@/src/services/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

interface WelcomeScreenProps {
  onStart: () => void;
  onLogout: () => Promise<void>;
}

export default function WelcomeScreen({ onStart, onLogout }: WelcomeScreenProps) {
  const router = useRouter();
  const { user, refreshProfile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [registering, setRegistering] = useState(false);

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyName) return;
    setRegistering(true);

    try {
      // 1. Criar a empresa no Firestore
      const companyRef = await addDoc(collection(firestore, "companies"), {
        name: companyName,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Atualizar o usuário para Admin e vincular à empresa
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        role: "admin",
        companyId: companyRef.id,
      });

      // 3. Atualizar a sessão (cookies) para refletir o novo cargo (Admin)
      // Isso garante que o middleware reconheça as novas permissões imediatamente
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken(true); // Força refresh para carregar novos claims
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
      }

      await refreshProfile();
      setIsModalOpen(false);
      setIsMenuOpen(false);
      alert("Empresa cadastrada com sucesso! Redirecionando para o seu painel...");
      router.push("/admin");
    } catch (error) {
      console.error("Erro ao cadastrar empresa:", error);
      alert("Falha ao registrar empresa. Tente novamente.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div 
      className="relative flex h-screen w-screen cursor-pointer flex-col items-center justify-between bg-brand-light p-12 text-brand-dark transition-all duration-300 select-none overflow-hidden"
      onClick={onStart}
    >
      {/* Background soft image overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop')" }}
      />
      
      {/* Menu de Perfil */}
      <div className="absolute top-6 right-6 z-30" onClick={(e) => e.stopPropagation()}>
        <button 
          className="flex items-center gap-2 rounded-full bg-white/80 p-3 text-brand-dark backdrop-blur-md transition-all hover:bg-brand-accent shadow-md border border-stone-200"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <User className="h-6 w-6" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-3 w-72 origin-top-right rounded-2xl bg-white shadow-2xl border border-stone-100 p-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-stone-50">
              <p className="text-sm font-bold truncate">{user?.name || "Usuário"}</p>
              <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
              {user?.role === 'admin' && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Administrador</span>
              )}
            </div>
            
            {user?.role !== "admin" && (
              <button 
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-stone-600 transition-colors hover:bg-stone-50"
                onClick={() => setIsModalOpen(true)}
              >
                <Building2 className="h-4 w-4 text-brand-accent" />
                <span>Traga sua empresa para o NexOrder</span>
              </button>
            )}

            {user?.role === "admin" && (
              <button
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-stone-600 transition-colors hover:bg-stone-50"
                onClick={() => router.push("/admin")}
              >
                <LayoutDashboard className="h-4 w-4 text-brand-accent" />
                <span>Painel Administrativo</span>
              </button>
            )}

            <button 
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-brand-dark">Sua Empresa</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterCompany} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Nome da Empresa</label>
                <input 
                  type="text" 
                  className="w-full p-4 rounded-2xl border-2 border-stone-100 focus:border-brand-accent outline-none transition-all"
                  placeholder="Ex: Minha Lanchonete"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-accent text-brand-dark py-4 rounded-2xl font-black shadow-xl shadow-yellow-500/20 hover:bg-brand-accentHover transition-all active:scale-95 disabled:opacity-50"
                disabled={registering}
              >
                {registering ? "CADASTRANDO..." : "VINCULAR MINHA EMPRESA"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Section: Logo */}
      <div className="relative z-10 flex flex-col items-center mt-12">
        <span className="text-xs font-bold tracking-widest text-brand-muted uppercase">Bem-vindo ao</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2 flex items-center gap-1 text-brand-dark">
          NexOrder
          <span className="h-2 w-2 rounded-full bg-brand-accent"></span>
        </h1>
      </div>

      {/* Middle Section: Premium visual element */}
      <div className="relative z-10 flex max-w-sm flex-col items-center text-center px-6">
        <div className="relative h-64 w-64 md:h-72 md:w-72 overflow-hidden rounded-full border-[6px] border-white shadow-xl shadow-stone-200">
          <img 
            src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop" 
            alt="Delicioso hambúrguer"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
        <p className="mt-8 text-lg font-medium text-stone-700">
          Sabor irresistível preparado em poucos toques.
        </p>
      </div>

      {/* Bottom Section: Tap to Start button */}
      <div className="relative z-10 mb-12 animate-bounce">
        <div className="flex items-center justify-center rounded-full bg-brand-accent px-10 py-5 shadow-lg shadow-yellow-500/10 hover:bg-brand-accentHover transition-colors duration-200">
          <span className="text-lg font-black tracking-wider text-brand-dark uppercase">
            Toque para iniciar
          </span>
        </div>
      </div>
    </div>
  );
}
